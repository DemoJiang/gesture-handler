import { TurboModule, TurboModuleContext } from 'rnoh/ts';
import { GestureHandlerRegistry } from './GestureHandlerRegistry';
import { GestureHandlerFactory } from "./GestureHandlerFactory"
import { ViewRegistry } from './ViewRegistry';
import { RNGHLogger } from './RNGHLogger';
import { EventDispatcher } from './EventDispatcher'

export enum ActionType {
  REANIMATED_WORKLET = 1,
  NATIVE_ANIMATED_EVENT = 2,
  JS_FUNCTION_OLD_API = 3,
  JS_FUNCTION_NEW_API = 4,
}


export class RNGestureHandlerModule extends TurboModule {
  static NAME = "RNGestureHandlerModule"

  private gestureHandlerRegistry = new GestureHandlerRegistry()
  private gestureHandlerFactory: GestureHandlerFactory | undefined = undefined
  private viewRegistry: ViewRegistry | undefined = undefined
  private logger: RNGHLogger

  constructor(ctx: TurboModuleContext) {
    super(ctx)
    this.logger = new RNGHLogger(ctx.logger, "RNGH")
  }

  public install() {
    this.viewRegistry = new ViewRegistry(this.ctx.descriptorRegistry)
    this.gestureHandlerFactory = new GestureHandlerFactory(this.logger)
  }

  public createGestureHandler(
    handlerName: string,
    handlerTag: number,
    config: Readonly<Record<string, unknown>>
  ) {
    if (!this.gestureHandlerFactory) {
      this.ctx.logger.error("Trying to create a gesture handler before creating gesture handler factory")
      return
    }
    const gestureHandler = this.gestureHandlerFactory.create(handlerName, handlerTag)
    this.gestureHandlerRegistry.addGestureHandler(gestureHandler)
    gestureHandler.updateGestureConfig(config)
  }

  public attachGestureHandler(
    handlerTag: number,
    newView: number,
    actionType: ActionType
  ) {
    const eventDispatcher = this.createEventDispatcher(actionType)
    if (!eventDispatcher) {
      this.ctx.logger.error("RNGH: Couldn't create EventDispatcher")
      return
    }
    const view = this.viewRegistry.getViewByTag(newView)
    this.gestureHandlerRegistry.bindGestureHandlerWithView(handlerTag, view)
    this.gestureHandlerRegistry
      .getGestureHandlerByHandlerTag(handlerTag)
      .setEventDispatcher(eventDispatcher)
  }

  private createEventDispatcher(actionType: ActionType): EventDispatcher | null {
    switch (actionType) {
      case ActionType.REANIMATED_WORKLET:
        this.ctx.logger.error("RNGH: Reanimated Worklets are not supported")
        break;
      case ActionType.NATIVE_ANIMATED_EVENT:
        this.ctx.logger.error("RNGH: Native animated events are not supported")
        break;
      case ActionType.JS_FUNCTION_OLD_API:
      case ActionType.JS_FUNCTION_NEW_API:
        return new EventDispatcher(this.ctx.rnInstanceManager, this.logger.cloneWithPrefix('EventDispatcher'));
    }
    return null
  }

  public updateGestureHandler(
    handlerTag: number,
    newConfig: Readonly<Record<string, unknown>>
  ) {
    const gestureHandler = this.gestureHandlerRegistry.getGestureHandlerByHandlerTag(handlerTag)
    gestureHandler.updateGestureConfig(newConfig)
  }

  public dropGestureHandler(handlerTag: number) {
    this.warn("dropGestureHandler is not implemented")
  }

  public handleSetJSResponder(tag: number, blockNativeResponder: boolean) {
    this.warn("handleSetJSResponder is not implemented")
  }

  public handleClearJSResponder() {
    this.warn("handleClearJSResponder is not implemented")
  }

  public flushOperations() {
    this.warn("flushOperations is not implemented")
  }

  // -------------------------------------------------------------------------------------------------------------------
  protected warn(message: string) {
    this.ctx.logger.warn("RNGH: " + message)
  }

  public getGestureHandlerRegistry() {
    return this.gestureHandlerRegistry
  }

  public getLogger() {
    return this.logger
  }
}
