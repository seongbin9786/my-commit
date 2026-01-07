// Command Palette에서 사용되는 커스텀 이벤트 정의

export const FOCUS_ACTIVITY_INPUT_EVENT = 'focusActivityInput';

/**
 * 신규 활동 입력창으로 focus 이벤트 발생
 */
export const focusActivityInput = () => {
  window.dispatchEvent(new CustomEvent(FOCUS_ACTIVITY_INPUT_EVENT));
};

/**
 * 신규 활동 입력창 focus 이벤트 리스너 등록
 */
export const addFocusActivityInputListener = (callback: () => void) => {
  window.addEventListener(FOCUS_ACTIVITY_INPUT_EVENT, callback);
  return () => window.removeEventListener(FOCUS_ACTIVITY_INPUT_EVENT, callback);
};
