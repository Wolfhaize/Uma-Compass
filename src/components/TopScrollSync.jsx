import React, { useEffect, useRef } from 'react'

// Wraps a horizontally-scrollable block (wide tables, bracket trees, etc.)
// with a slim mirrored scrollbar pinned above the content, in addition to
// the normal one below. Without this, wide content on the schedule/results
// page forces you to scroll all the way down just to find a scrollbar.
export default function TopScrollSync({ children, className = '' }) {
  const topRef = useRef(null)
  const bottomRef = useRef(null)
  const spacerRef = useRef(null)
  const syncing = useRef(false)

  useEffect(() => {
    const top = topRef.current
    const bottom = bottomRef.current
    const spacer = spacerRef.current
    if (!top || !bottom || !spacer) return

    function updateWidth() {
      spacer.style.width = bottom.scrollWidth + 'px'
    }
    updateWidth()

    const ro = new ResizeObserver(updateWidth)
    ro.observe(bottom)

    function onTopScroll() {
      if (syncing.current) return
      syncing.current = true
      bottom.scrollLeft = top.scrollLeft
      syncing.current = false
    }
    function onBottomScroll() {
      if (syncing.current) return
      syncing.current = true
      top.scrollLeft = bottom.scrollLeft
      syncing.current = false
    }
    top.addEventListener('scroll', onTopScroll)
    bottom.addEventListener('scroll', onBottomScroll)
    return () => {
      ro.disconnect()
      top.removeEventListener('scroll', onTopScroll)
      bottom.removeEventListener('scroll', onBottomScroll)
    }
  }, [])

  return (
    <div className="top-scroll-sync">
      <div className="top-scroll-sync-bar" ref={topRef}>
        <div ref={spacerRef} style={{ height: 1 }} />
      </div>
      <div className={className} ref={bottomRef}>
        {children}
      </div>
    </div>
  )
}
