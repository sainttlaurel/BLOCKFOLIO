/**
 * :focus-visible Polyfill
 * 
 * Provides :focus-visible pseudo-class functionality for browsers that don't support it
 * Adds .focus-visible class to elements that should show focus indicators
 */

if (typeof window !== 'undefined') {
  try {
    document.querySelector(':focus-visible');
  } catch (e) {
    // Browser doesn't support :focus-visible, apply polyfill
    
    let hadKeyboardEvent = true;
    let hadFocusVisibleRecently = false;
    let hadFocusVisibleRecentlyTimeout = null;
    
    const inputTypesWhitelist = {
      text: true,
      search: true,
      url: true,
      tel: true,
      email: true,
      password: true,
      number: true,
      date: true,
      month: true,
      week: true,
      time: true,
      datetime: true,
      'datetime-local': true
    };
    
    function focusTriggersKeyboardModality(el) {
      const type = el.type;
      const tagName = el.tagName;
      
      if (tagName === 'INPUT' && inputTypesWhitelist[type] && !el.readOnly) {
        return true;
      }
      
      if (tagName === 'TEXTAREA' && !el.readOnly) {
        return true;
      }
      
      if (el.isContentEditable) {
        return true;
      }
      
      return false;
    }
    
    function addFocusVisibleClass(el) {
      if (el.classList.contains('focus-visible')) {
        return;
      }
      el.classList.add('focus-visible');
      el.setAttribute('data-focus-visible-added', '');
    }
    
    function removeFocusVisibleClass(el) {
      if (!el.hasAttribute('data-focus-visible-added')) {
        return;
      }
      el.classList.remove('focus-visible');
      el.removeAttribute('data-focus-visible-added');
    }
    
    function onKeyDown(e) {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      hadKeyboardEvent = true;
    }
    
    function onPointerDown() {
      hadKeyboardEvent = false;
    }
    
    function onFocus(e) {
      if (focusTriggersKeyboardModality(e.target)) {
        addFocusVisibleClass(e.target);
        return;
      }
      
      if (hadKeyboardEvent) {
        addFocusVisibleClass(e.target);
      }
    }
    
    function onBlur(e) {
      if (e.target.classList.contains('focus-visible')) {
        hadFocusVisibleRecently = true;
        window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        hadFocusVisibleRecentlyTimeout = window.setTimeout(() => {
          hadFocusVisibleRecently = false;
        }, 100);
        removeFocusVisibleClass(e.target);
      }
    }
    
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (hadFocusVisibleRecently) {
          hadKeyboardEvent = true;
        }
      }
    }
    
    // Add event listeners
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
    document.addEventListener('visibilitychange', onVisibilityChange, true);
    
    // Add CSS for focus-visible class
    const style = document.createElement('style');
    style.textContent = `
      [data-focus-visible-added] {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      [data-focus-visible-added]:not(:focus-visible) {
        outline: none;
      }
    `;
    document.head.appendChild(style);
    
    console.log('✅ :focus-visible polyfill loaded');
  }
}

export default {};
