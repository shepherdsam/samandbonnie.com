'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import ProtectedImage from '@/components/ProtectedImage';
import { photoSrc, type Photo } from '@/lib/albums';

type PhotoAlbumProps = {
  slug: string;
  title: string;
  photos: Photo[];
  initialParam?: string;
};

function parseIndex(value: string | null | undefined, count: number): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1 || n > count) return null;
  return n - 1;
}

function neighborIndexes(index: number, count: number): number[] {
  const next: number[] = [];
  if (index > 0) next.push(index - 1);
  if (index < count - 1) next.push(index + 1);
  return next;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2;
const SNAP_SCALE = 1.05;
const SWIPE_PX = 50;
const TAP_SLOP = 8;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_DISTANCE = 28;

type Zoom = { scale: number; x: number; y: number };

type ZoomBinding = {
  lightbox: HTMLElement;
  stage: HTMLElement;
  imageRef: { current: HTMLImageElement | null };
  zoomRef: { current: Zoom };
  sessionRef: { current: number };
  stepRef: { current: (delta: number) => void };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stageCenter(stage: HTMLElement) {
  const rect = stage.getBoundingClientRect();
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
}

function limitPan(stage: HTMLElement, fittedW: number, fittedH: number, x: number, y: number, scale: number) {
  if (scale <= 1 || fittedW <= 0 || fittedH <= 0) return { x: 0, y: 0 };
  const maxX = Math.max(0, (fittedW * scale - stage.clientWidth) / 2);
  const maxY = Math.max(0, (fittedH * scale - stage.clientHeight) / 2);
  return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
}

function clearDrawnSize(image: HTMLImageElement) {
  image.style.width = '';
  image.style.height = '';
  image.style.maxWidth = '';
  image.style.maxHeight = '';
  image.style.minWidth = '';
  image.style.minHeight = '';
  image.style.flexShrink = '';
}

// Grow the image's layout box up to the file's real pixels. A CSS scale() only
// enlarges the small bitmap already painted for the screen.
function sharpLayoutScale(image: HTMLImageElement, fittedW: number, fittedH: number, scale: number) {
  const dpr = window.devicePixelRatio || 1;
  if (!image.naturalWidth || !image.naturalHeight || fittedW <= 0 || fittedH <= 0) return scale;
  const cap = Math.min(
    image.naturalWidth / (fittedW * dpr),
    image.naturalHeight / (fittedH * dpr),
  );
  return Math.min(scale, Math.max(1, cap));
}

function paintZoom(
  stage: HTMLElement,
  image: HTMLImageElement | null,
  zoom: Zoom,
  animate: boolean,
  fitted: { w: number; h: number },
) {
  const zoomed = zoom.scale > 1 || zoom.x !== 0 || zoom.y !== 0;
  stage.classList.toggle('is-zoomed', zoomed);
  if (!image) return;
  image.classList.toggle('is-settling', animate);
  image.classList.toggle('is-pannable', zoom.scale > 1);
  if (!zoomed && !animate) {
    clearDrawnSize(image);
    image.style.transform = '';
    return;
  }
  if (!zoomed) {
    const layoutScale = image.style.width && fitted.w > 0 ? image.offsetWidth / fitted.w : 1;
    const residual = layoutScale > 0 ? 1 / layoutScale : 1;
    image.style.transform = `translate(0px, 0px) scale(${residual})`;
    return;
  }

  const layoutScale = image.style.width && fitted.w > 0 ? image.offsetWidth / fitted.w : 1;
  if (!animate && fitted.w > 0 && fitted.h > 0) {
    const layout = sharpLayoutScale(image, fitted.w, fitted.h, zoom.scale);
    image.style.maxWidth = 'none';
    image.style.maxHeight = 'none';
    image.style.flexShrink = '0';
    image.style.width = `${fitted.w * layout}px`;
    image.style.height = `${fitted.h * layout}px`;
    image.style.minWidth = `${fitted.w * layout}px`;
    image.style.minHeight = `${fitted.h * layout}px`;
    const residual = zoom.scale / layout;
    const scalePart = Math.abs(residual - 1) < 0.001 ? '' : ` scale(${residual})`;
    image.style.transform = `translate(${zoom.x}px, ${zoom.y}px)${scalePart}`;
    return;
  }

  const residual = layoutScale > 0 ? zoom.scale / layoutScale : zoom.scale;
  image.style.transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${residual})`;
}

function isControlTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button'));
}

function isImageTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('.lightbox-image'));
}

// Safari pinch-zooms the page unless touchmove preventDefault runs, and a
// passive listener cannot do that. Page zoom would also slide visualViewport
// out from under the lightbox pin.
function bindLightboxZoom({ lightbox, stage, imageRef, zoomRef, sessionRef, stepRef }: ZoomBinding) {
  type Mode = 'idle' | 'pending' | 'pan' | 'pinch';
  let mode: Mode = 'idle';
  let seen = sessionRef.current;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let pinchDist = 1;
  let pinchScale = 1;
  let pinchPx = 0;
  let pinchPy = 0;
  let moved = false;
  let rejected = false;
  let resizeFrame = 0;
  let lastTapAt = 0;
  let lastTapX = 0;
  let lastTapY = 0;
  let fitted = { w: 0, h: 0, src: '' };

  function baseSize(image: HTMLImageElement) {
    const src = image.currentSrc;
    if (src && fitted.src === src && fitted.w > 0) return fitted;
    if (image.style.width) return fitted.w > 0 ? fitted : { w: image.offsetWidth, h: image.offsetHeight };
    const w = image.offsetWidth;
    const h = image.offsetHeight;
    if (src && w > 0 && h > 0) fitted = { w, h, src };
    return fitted.w > 0 ? fitted : { w, h };
  }

  function draw(image: HTMLImageElement | null, zoom: Zoom, animate: boolean) {
    paintZoom(stage, image, zoom, animate, image ? baseSize(image) : { w: 0, h: 0 });
    if (!animate) return;
    window.setTimeout(() => {
      if (mode === 'pinch' || mode === 'pan') return;
      sharpen();
    }, 200);
  }

  function clampPan(image: HTMLImageElement, x: number, y: number, scale: number) {
    const base = baseSize(image);
    return limitPan(stage, base.w, base.h, x, y, scale);
  }

  function sharpen() {
    const image = imageRef.current;
    if (!image) return;
    image.classList.remove('is-settling');
    image.style.transition = 'none';
    draw(image, zoomRef.current, false);
    image.style.transition = '';
  }

  function droppedSession() {
    if (seen === sessionRef.current) return false;
    seen = sessionRef.current;
    mode = 'idle';
    moved = false;
    rejected = false;
    lastTapAt = 0;
    fitted = { w: 0, h: 0, src: '' };
    return true;
  }

  function zoomToPoint(clientX: number, clientY: number, scale: number) {
    const image = imageRef.current;
    if (!image) return;
    if (scale <= 1) {
      zoomRef.current = { scale: 1, x: 0, y: 0 };
      draw(image, zoomRef.current, true);
      return;
    }
    const center = stageCenter(stage);
    const zoom = zoomRef.current;
    const localX = (clientX - center.cx - zoom.x) / zoom.scale;
    const localY = (clientY - center.cy - zoom.y) / zoom.scale;
    const next = clampPan(
      image,
      clientX - center.cx - localX * scale,
      clientY - center.cy - localY * scale,
      scale,
    );
    zoomRef.current = { scale, x: next.x, y: next.y };
    draw(image, zoomRef.current, true);
  }

  function consumeDoubleTap(touch: Touch) {
    const now = performance.now();
    const distance = Math.hypot(touch.clientX - lastTapX, touch.clientY - lastTapY);
    const repeated = now - lastTapAt <= DOUBLE_TAP_MS && distance <= DOUBLE_TAP_DISTANCE;
    lastTapAt = now;
    lastTapX = touch.clientX;
    lastTapY = touch.clientY;
    if (!repeated) return false;
    lastTapAt = 0;
    if (zoomRef.current.scale > SNAP_SCALE) zoomToPoint(touch.clientX, touch.clientY, 1);
    else zoomToPoint(touch.clientX, touch.clientY, DOUBLE_TAP_SCALE);
    return true;
  }

  function syncFromImage() {
    const image = imageRef.current;
    if (!image) return;
    const base = baseSize(image);
    const value = getComputedStyle(image).transform;
    let residual = 1;
    let x = 0;
    let y = 0;
    if (value && value !== 'none') {
      const matrix = new DOMMatrix(value);
      residual = matrix.a || 1;
      x = matrix.e;
      y = matrix.f;
    }
    const layoutScale = image.style.width && base.w > 0 ? image.offsetWidth / base.w : 1;
    const scale = clamp(residual * layoutScale, 1, MAX_SCALE);
    zoomRef.current = scale <= 1.001 && Math.abs(x) < 0.5 && Math.abs(y) < 0.5
      ? { scale: 1, x: 0, y: 0 }
      : { scale, x, y };
  }

  function beginPinch(touches: TouchList) {
    syncFromImage();
    const first = touches.item(0);
    const second = touches.item(1);
    const image = imageRef.current;
    if (!first || !second || !image) return;
    const center = stageCenter(stage);
    const zoom = zoomRef.current;
    const midX = (first.clientX + second.clientX) / 2;
    const midY = (first.clientY + second.clientY) / 2;
    pinchDist = Math.max(Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY), 1);
    pinchScale = zoom.scale;
    originX = zoom.x;
    originY = zoom.y;
    pinchPx = (midX - center.cx - originX) / pinchScale;
    pinchPy = (midY - center.cy - originY) / pinchScale;
    mode = 'pinch';
    moved = true;
    draw(image, zoom, false);
  }

  function applyPinch(touches: TouchList) {
    const first = touches.item(0);
    const second = touches.item(1);
    const image = imageRef.current;
    if (!first || !second || !image) return;
    const center = stageCenter(stage);
    const midX = (first.clientX + second.clientX) / 2;
    const midY = (first.clientY + second.clientY) / 2;
    const dist = Math.max(Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY), 1);
    const scale = clamp(pinchScale * (dist / pinchDist), 1, MAX_SCALE);
    const next = clampPan(
      image,
      midX - center.cx - pinchPx * scale,
      midY - center.cy - pinchPy * scale,
      scale,
    );
    zoomRef.current = { scale, x: next.x, y: next.y };
    draw(image, zoomRef.current, false);
  }

  function onStart(event: TouchEvent) {
    droppedSession();
    if (event.touches.length === 1) {
      if (isControlTarget(event.target)) {
        rejected = true;
        return;
      }
      rejected = false;
      syncFromImage();
      const touch = event.touches.item(0);
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      originX = zoomRef.current.x;
      originY = zoomRef.current.y;
      moved = false;
      mode = zoomRef.current.scale > 1 ? 'pan' : 'pending';
      draw(imageRef.current, zoomRef.current, false);
      return;
    }
    if (event.touches.length === 2 && !rejected) beginPinch(event.touches);
  }

  function onMove(event: TouchEvent) {
    if (droppedSession()) return;
    if (event.touches.length >= 2) {
      if (rejected) {
        if (event.cancelable) event.preventDefault();
        return;
      }
      if (mode !== 'pinch') beginPinch(event.touches);
      applyPinch(event.touches);
      if (event.cancelable) event.preventDefault();
      return;
    }
    const touch = event.touches.item(0);
    if (!touch) return;
    if (mode === 'pan') {
      const image = imageRef.current;
      if (!image) return;
      const limited = clampPan(
        image,
        originX + (touch.clientX - startX),
        originY + (touch.clientY - startY),
        zoomRef.current.scale,
      );
      zoomRef.current = { scale: zoomRef.current.scale, x: limited.x, y: limited.y };
      draw(image, zoomRef.current, false);
      if (Math.hypot(touch.clientX - startX, touch.clientY - startY) > TAP_SLOP) moved = true;
      if (event.cancelable) event.preventDefault();
      return;
    }
    if (mode !== 'pending') return;
    if (Math.hypot(touch.clientX - startX, touch.clientY - startY) <= TAP_SLOP) return;
    moved = true;
    if (event.cancelable) event.preventDefault();
  }

  function onEnd(event: TouchEvent) {
    if (droppedSession()) return;
    if (mode === 'pinch' && event.touches.length === 1) {
      const touch = event.touches.item(0);
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      originX = zoomRef.current.x;
      originY = zoomRef.current.y;
      mode = zoomRef.current.scale > 1 ? 'pan' : 'idle';
      if (moved && event.cancelable) event.preventDefault();
      return;
    }
    if (event.touches.length > 0) {
      if (moved && event.cancelable) event.preventDefault();
      return;
    }

    if ((mode === 'pending' || mode === 'pan') && event.type !== 'touchcancel') {
      const touch = event.changedTouches.item(0);
      if (touch) {
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const stationary = Math.hypot(dx, dy) <= TAP_SLOP;
        if (mode === 'pending' && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
          moved = true;
          lastTapAt = 0;
          stepRef.current(dx > 0 ? -1 : 1);
        } else if (stationary && isImageTarget(event.target)) {
          if (consumeDoubleTap(touch)) moved = true;
        } else {
          lastTapAt = 0;
        }
      }
    }

    const zoom = zoomRef.current;
    if (zoom.scale < SNAP_SCALE && (zoom.scale !== 1 || zoom.x !== 0 || zoom.y !== 0)) {
      zoomRef.current = { scale: 1, x: 0, y: 0 };
      draw(imageRef.current, zoomRef.current, true);
    }

    if (moved && event.cancelable) event.preventDefault();
    mode = 'idle';
    moved = false;
    rejected = false;
  }

  function blockBrowserPinch(event: Event) {
    if (event.cancelable) event.preventDefault();
  }

  function remeasureFitted(image: HTMLImageElement) {
    const saved = {
      width: image.style.width,
      height: image.style.height,
      maxWidth: image.style.maxWidth,
      maxHeight: image.style.maxHeight,
      minWidth: image.style.minWidth,
      minHeight: image.style.minHeight,
      flexShrink: image.style.flexShrink,
    };
    clearDrawnSize(image);
    const w = image.offsetWidth;
    const h = image.offsetHeight;
    image.style.width = saved.width;
    image.style.height = saved.height;
    image.style.maxWidth = saved.maxWidth;
    image.style.maxHeight = saved.maxHeight;
    image.style.minWidth = saved.minWidth;
    image.style.minHeight = saved.minHeight;
    image.style.flexShrink = saved.flexShrink;
    if (image.currentSrc && w > 0 && h > 0) fitted = { w, h, src: image.currentSrc };
  }

  function reclamp() {
    const image = imageRef.current;
    const zoom = zoomRef.current;
    if (!image || zoom.scale <= 1) return;
    remeasureFitted(image);
    const limited = clampPan(image, zoom.x, zoom.y, zoom.scale);
    zoomRef.current = { scale: zoom.scale, x: limited.x, y: limited.y };
    draw(image, zoomRef.current, false);
  }

  function onResize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(reclamp);
  }

  let pointerDown = false;
  let dragMoved = false;
  let suppressClick = false;

  function endMouseGesture() {
    pointerDown = false;
    lightbox.classList.remove('is-panning');
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (dragMoved) suppressClick = true;
    if (mode === 'pan') mode = 'idle';
    dragMoved = false;
  }

  function onMouseDown(event: MouseEvent) {
    if (event.button !== 0 || pointerDown) return;
    droppedSession();
    if (isControlTarget(event.target) || !isImageTarget(event.target)) return;
    syncFromImage();
    pointerDown = true;
    dragMoved = false;
    startX = event.clientX;
    startY = event.clientY;
    originX = zoomRef.current.x;
    originY = zoomRef.current.y;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(event: MouseEvent) {
    if (!pointerDown) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.hypot(dx, dy) <= TAP_SLOP) return;
    dragMoved = true;
    if (zoomRef.current.scale <= 1) return;
    const image = imageRef.current;
    if (!image) return;
    if (mode !== 'pan') {
      mode = 'pan';
      lightbox.classList.add('is-panning');
    }
    const limited = clampPan(image, originX + dx, originY + dy, zoomRef.current.scale);
    zoomRef.current = { scale: zoomRef.current.scale, x: limited.x, y: limited.y };
    draw(image, zoomRef.current, false);
    event.preventDefault();
  }

  function onMouseUp() {
    endMouseGesture();
  }

  function onMouseClick(event: MouseEvent) {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onDoubleClick(event: MouseEvent) {
    if (event.button !== 0 || !isImageTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    syncFromImage();
    if (zoomRef.current.scale > SNAP_SCALE) zoomToPoint(event.clientX, event.clientY, 1);
    else zoomToPoint(event.clientX, event.clientY, DOUBLE_TAP_SCALE);
  }

  function onTransitionEnd(event: TransitionEvent) {
    const image = imageRef.current;
    if (!image || event.target !== image || event.propertyName !== 'transform') return;
    if (!image.classList.contains('is-settling')) return;
    if (mode === 'pinch' || mode === 'pan') return;
    sharpen();
  }

  lightbox.addEventListener('transitionend', onTransitionEnd);
  lightbox.addEventListener('mousedown', onMouseDown);
  lightbox.addEventListener('dblclick', onDoubleClick);
  lightbox.addEventListener('click', onMouseClick, true);
  lightbox.addEventListener('touchstart', onStart);
  lightbox.addEventListener('touchmove', onMove, { passive: false });
  lightbox.addEventListener('touchend', onEnd, { passive: false });
  lightbox.addEventListener('touchcancel', onEnd, { passive: false });
  lightbox.addEventListener('gesturestart', blockBrowserPinch, { passive: false });
  lightbox.addEventListener('gesturechange', blockBrowserPinch, { passive: false });
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(resizeFrame);
    endMouseGesture();
    suppressClick = false;
    lightbox.classList.remove('is-panning');
    lightbox.removeEventListener('transitionend', onTransitionEnd);
    lightbox.removeEventListener('mousedown', onMouseDown);
    lightbox.removeEventListener('dblclick', onDoubleClick);
    lightbox.removeEventListener('click', onMouseClick, true);
    lightbox.removeEventListener('touchstart', onStart);
    lightbox.removeEventListener('touchmove', onMove);
    lightbox.removeEventListener('touchend', onEnd);
    lightbox.removeEventListener('touchcancel', onEnd);
    lightbox.removeEventListener('gesturestart', blockBrowserPinch);
    lightbox.removeEventListener('gesturechange', blockBrowserPinch);
    window.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('resize', onResize);
  };
}

export default function PhotoAlbum({ slug, title, photos, initialParam }: PhotoAlbumProps) {
  const pathname = usePathname();
  const count = photos.length;
  const [index, setIndex] = useState<number | null>(() => parseIndex(initialParam, count));
  const [readyFile, setReadyFile] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const zoomRef = useRef<Zoom>({ scale: 1, x: 0, y: 0 });
  const sessionRef = useRef(0);
  const stepRef = useRef<(delta: number) => void>(() => {});

  const setOpen = useCallback((next: number | null) => {
    setIndex(next);
    if (next === null) {
      setReadyFile(null);
      setSlow(false);
    }
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (index === null || count === 0) return;
      const next = index + delta;
      if (next < 0 || next >= count) return;
      setIndex(next);
    },
    [count, index],
  );
  stepRef.current = step;

  useEffect(() => {
    const url = index === null ? pathname : `${pathname}?p=${index + 1}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === url) return;
    window.history.replaceState(window.history.state, '', url);
  }, [index, pathname]);

  useEffect(() => {
    function onPop() {
      const p = new URL(window.location.href).searchParams.get('p');
      setIndex(parseIndex(p, count));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [count]);

  const lightboxOpen = index !== null;

  useEffect(() => {
    if (!lightboxOpen) setHelpOpen(false);
  }, [lightboxOpen]);

  useLayoutEffect(() => {
    sessionRef.current += 1;
    zoomRef.current = { scale: 1, x: 0, y: 0 };
    stageRef.current?.classList.remove('is-zoomed');
    const image = imageRef.current;
    if (!image) return;
    image.classList.remove('is-settling');
    image.style.transform = '';
    clearDrawnSize(image);
  }, [index]);

  useEffect(() => {
    const lightbox = lightboxRef.current;
    const stage = stageRef.current;
    if (!lightboxOpen || !lightbox || !stage) return;
    return bindLightboxZoom({ lightbox, stage, imageRef, zoomRef, sessionRef, stepRef });
  }, [lightboxOpen]);

  useLayoutEffect(() => {
    if (!lightboxOpen) return;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
      overflowX: body.style.overflowX,
      overflowY: body.style.overflowY,
    };
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    // iOS Safari anchors position:fixed to the top of the document when body
    // overflow is hidden or clip, so a photo opened mid-album sits off screen.
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflowX = 'visible';
    body.style.overflowY = 'visible';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      body.style.overflowX = previous.overflowX;
      body.style.overflowY = previous.overflowY;
      window.scrollTo(scrollX, scrollY);
    };
  }, [lightboxOpen]);

  useLayoutEffect(() => {
    if (!lightboxOpen) return;
    const node = lightboxRef.current;
    const viewport = window.visualViewport;
    if (!node || !viewport) return;

    const pin = () => {
      node.style.top = `${viewport.offsetTop}px`;
      node.style.height = `${viewport.height}px`;
    };
    pin();
    viewport.addEventListener('resize', pin);
    viewport.addEventListener('scroll', pin);
    return () => {
      viewport.removeEventListener('resize', pin);
      viewport.removeEventListener('scroll', pin);
      node.style.top = '';
      node.style.height = '';
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (index === null) return;
    closeRef.current?.focus({ preventScroll: true });

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        setOpen(null);
      } else if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'ArrowRight') {
        step(1);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [helpOpen, index, setOpen, step]);

  const openPhoto = index !== null ? photos[index] : null;
  const targetFile = openPhoto?.file ?? null;
  const waiting = Boolean(targetFile && readyFile !== targetFile && slow);
  const preloadFiles = index === null
    ? []
    : neighborIndexes(index, count).map((i) => photos[i].file);

  useEffect(() => {
    if (!targetFile || readyFile === targetFile) {
      setSlow(false);
      return;
    }
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 120);
    return () => window.clearTimeout(timer);
  }, [targetFile, readyFile]);

  return (
    <>
      <ul className="photo-grid">
        {photos.map((photo, i) => (
          <li key={photo.file}>
            <button
              type="button"
              className="photo-cell"
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1} of ${count} in ${title}`}
            >
              <ProtectedImage
                src={photoSrc(slug, photo.file, 'thumb')}
                alt=""
              />
            </button>
          </li>
        ))}
      </ul>

      {openPhoto && index !== null && targetFile ? (
        <div
          ref={lightboxRef}
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title}, photo ${index + 1} of ${count}`}
          aria-busy={waiting}
          onClick={() => {
            if (helpOpen) {
              setHelpOpen(false);
              return;
            }
            setOpen(null);
          }}
        >
          <button
            type="button"
            className="lightbox-help"
            aria-label="Zoom help"
            aria-expanded={helpOpen}
            aria-controls="lightbox-zoom-help"
            onClick={(event) => {
              event.stopPropagation();
              setHelpOpen((open) => !open);
            }}
          >
            <span aria-hidden="true">?</span>
          </button>
          {helpOpen ? (
            <div
              id="lightbox-zoom-help"
              className="lightbox-help-popup"
              role="note"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="lightbox-help-title">Zoom</p>
              <ul>
                <li>Pinch to zoom</li>
                <li>Double-tap to zoom</li>
                <li>Double-click to zoom, on a computer</li>
              </ul>
            </div>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            className="lightbox-close"
            onClick={() => setOpen(null)}
            aria-label="Close"
          >
            ×
          </button>
          {index > 0 ? (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              aria-label="Previous photo"
            >
              ‹
            </button>
          ) : null}
          <div className="lightbox-stage" ref={stageRef}>
            <img
              className="lightbox-image"
              src={photoSrc(slug, readyFile ?? targetFile, 'full')}
              alt={`${title} photo ${index + 1}`}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
              onClick={(event) => {
                event.stopPropagation();
                setHelpOpen(false);
              }}
              onLoad={() => setReadyFile((current) => current ?? targetFile)}
              ref={(node) => {
                imageRef.current = node;
                if (node?.complete && node.naturalWidth > 0) {
                  queueMicrotask(() => setReadyFile((current) => current ?? targetFile));
                }
              }}
            />
          </div>
          {waiting ? <div className="lightbox-waiting" aria-hidden="true" /> : null}
          {targetFile !== readyFile ? (
            <img
              className="lightbox-preload"
              src={photoSrc(slug, targetFile, 'full')}
              alt=""
              onLoad={() => setReadyFile(targetFile)}
              ref={(node) => {
                if (node?.complete && node.naturalWidth > 0) {
                  queueMicrotask(() => setReadyFile(targetFile));
                }
              }}
            />
          ) : null}
          {preloadFiles.map((file) => (
            <img
              key={file}
              className="lightbox-preload"
              src={photoSrc(slug, file, 'full')}
              alt=""
            />
          ))}
          {index < count - 1 ? (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              aria-label="Next photo"
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
