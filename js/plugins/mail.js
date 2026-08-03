// Bookie 3.1.0 Step3 - Mail Plugin
// 목적: 메일 UI 기능을 Plugin 구조에 등록할 자리만 만든다.
// 현재 Stable 기준에는 별도의 메일 변환 JS 로직이 없어서 출력 변경 없이 등록만 수행한다.
(function(global){
  const MailPlugin = {
    name: "mail",
    order: 20,
    enabled: true,

    setup(context){
      // Reserved for future mail UI initialization.
      // 기능 추가 금지: 현재 Step에서는 아무 동작도 하지 않는다.
      return context;
    },

    run(context){
      // Output Lock: 입력을 그대로 반환한다.
      return context;
    }
  };

  global.MailPlugin = MailPlugin;

  if(global.Plugin && typeof global.Plugin.register === "function"){
    global.Plugin.register(MailPlugin);
  }
})(window);
