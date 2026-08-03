// Bookie 3.3.1 - Lifecycle Foundation Upgrade
// Hook points for Logger / Debug / Plugin layers. Defaults are no-op.

const BookieLifecycle = {
  beforePipeline(context){},
  beforeStep(step, context){},
  afterStep(step, context){},
  afterPipeline(context){}
};

if(typeof window !== "undefined"){
  window.BookieLifecycle = BookieLifecycle;
}
