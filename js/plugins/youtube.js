// Bookie 3.1.0 Step4 - YouTube Plugin
// 목적: YouTube UI 기능을 Plugin 구조에 등록할 자리만 만든다.
// 현재 Step에서는 기존 출력 결과를 바꾸지 않기 위해 입력을 그대로 반환한다.
(function(global){
  const YoutubePlugin = {
    name: "youtube",
    order: 30,
    enabled: true,

    setup(context){
      // Reserved for future YouTube UI initialization.
      // 기능 추가 금지: 현재 Step에서는 아무 동작도 하지 않는다.
      return context;
    },

    run(context){
      // Output Lock: 입력을 그대로 반환한다.
      return context;
    }
  };

  global.YoutubePlugin = YoutubePlugin;

  if(global.Plugin && typeof global.Plugin.register === "function"){
    global.Plugin.register(YoutubePlugin);
  }
})(window);
