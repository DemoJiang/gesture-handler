import type { GestureHandlerOrchestrator } from "./GestureHandlerOrchestrator"
import type { PointerTracker } from "./PointerTracker"
import type { View } from "./View"
import type { EventDispatcher } from "./EventDispatcher"
import { State } from "./State"
import { HitSlop, Directions, AdaptedEvent, PointerType } from "./Event"
import { GestureStateChangeEvent, GestureTouchEvent } from "./OutgoingEvent"


export interface Handler {
  handlerTag: number;
}

export interface GestureConfig {
  enabled?: boolean;
  simultaneousHandlers?: Handler[] | null;
  waitFor?: Handler[] | null;
  hitSlop?: HitSlop;
  shouldCancelWhenOutside?: boolean;
  activateAfterLongPress?: number;
  failOffsetXStart?: number;
  failOffsetYStart?: number;
  failOffsetXEnd?: number;
  failOffsetYEnd?: number;
  activeOffsetXStart?: number;
  activeOffsetXEnd?: number;
  activeOffsetYStart?: number;
  activeOffsetYEnd?: number;
  minPointers?: number;
  maxPointers?: number;
  minDist?: number;
  minDistSq?: number;
  minVelocity?: number;
  minVelocityX?: number;
  minVelocityY?: number;
  minVelocitySq?: number;
  maxDist?: number;
  maxDistSq?: number;
  numberOfPointers?: number;
  minDurationMs?: number;
  numberOfTaps?: number;
  maxDurationMs?: number;
  maxDelayMs?: number;
  maxDeltaX?: number;
  maxDeltaY?: number;
  shouldActivateOnStart?: boolean;
  disallowInterruption?: boolean;
  direction?: typeof Directions;
  needsPointerData?: boolean
  // --- Tap
  minNumberOfPointers?: number
}

type PointerId = number


export type GestureHandlerDependencies = {
  handlerTag: number
  orchestrator: GestureHandlerOrchestrator
  tracker: PointerTracker
  eventDispatcher: EventDispatcher
}

export abstract class GestureHandler {
  protected config: GestureConfig = {}
  protected currentState: State
  protected view: View | undefined = undefined
  protected lastSentState: State | undefined = undefined
  protected shouldCancelWhenOutside = false
  protected handlerTag: number
  protected orchestrator: GestureHandlerOrchestrator
  protected tracker: PointerTracker
  protected eventDispatcher: EventDispatcher

  protected isActivated = false
  protected isAwaiting_ = false
  protected pointerType: PointerType

  constructor(deps: GestureHandlerDependencies
  ) {
    this.handlerTag = deps.handlerTag
    this.orchestrator = deps.orchestrator
    this.tracker = deps.tracker
    this.eventDispatcher = deps.eventDispatcher
  }

  public onPointerDown(e: AdaptedEvent) {
    this.orchestrator.registerHandlerIfNotPresent(this);
    this.pointerType = e.pointerType;
    if (this.pointerType === PointerType.TOUCH) {
      this.orchestrator.cancelMouseAndPenGestures(this);
    }
    if (this.config.needsPointerData) {
      this.sendTouchEvent(e);
    }
  }

  protected sendTouchEvent(e: AdaptedEvent) {
    if (!this.config.enabled) {
      return;
    }


    const touchEvent: GestureTouchEvent | undefined =
    this.createTouchEventIfPossible(e);

    if (touchEvent) {
      // TODO
      // this.eventDispatcher.onGestureHandlerEvent(touchEvent)
    }
  }

  protected createTouchEventIfPossible(e: AdaptedEvent): GestureTouchEvent | undefined {
    return undefined;
  }

  public onPointerUp(e: AdaptedEvent): void {
    if (this.config.needsPointerData) this.sendTouchEvent(e)
  }

  public onAdditionalPointerAdd(e: AdaptedEvent): void {
    if (this.config.needsPointerData) this.sendTouchEvent(e)
  }

  public onAdditionalPointerRemove(e: AdaptedEvent): void {
    if (this.config.needsPointerData) this.sendTouchEvent(e)
  }

  public onPointerMove(e: AdaptedEvent): void {
    this.tryToSendMoveEvent(false);
    if (this.config.needsPointerData) {
      this.sendTouchEvent(e);
    }
  }

  private tryToSendMoveEvent(out: boolean): void {
    if (
      this.config.enabled &&
      this.isActivated &&
        (!out || (out && !this.shouldCancelWhenOutside))
    ) {
      this.sendEvent({ newState: this.currentState, oldState: this.currentState });
    }
  }

  public onPointerEnter(e: AdaptedEvent): void {
    if (this.config.needsPointerData) {
      this.sendTouchEvent(e)
    }
  }

  public onPointerOut(e: AdaptedEvent): void {
    if (this.shouldCancelWhenOutside) {
      switch (this.currentState) {
        case State.ACTIVE:
          this.cancel();
          break;
        case State.BEGAN:
          this.fail();
          break;
      }
      return;
    }
    if (this.config.needsPointerData) {
      this.sendTouchEvent(e);
    }
  }

  public onPointerCancel(e: AdaptedEvent): void {
    if (this.config.needsPointerData) {
      this.sendTouchEvent(e);
    }
    this.cancel();
    this.reset();
  }

  public onPointerOutOfBounds(e: AdaptedEvent): void {
    this.tryToSendMoveEvent(true);
    if (this.config.needsPointerData) {
      this.sendTouchEvent(e);
    }
  }

  public onViewAttached(view: View) {
    this.view = view
  }

  public getTag(): number {
    return this.handlerTag
  }

  public getTracker() {
    return this.tracker
  }

  public getView() {
    return this.view
  }

  protected begin(): void {
    if (!this.isWithinHitSlop()) return;
    if (this.currentState === State.UNDETERMINED) {
      this.moveToState(State.BEGAN);
    }
  }

  private isWithinHitSlop(): boolean {
    if (!this.config.hitSlop) {
      return true;
    }

    const width = this.view.getBoundingRect().width;
    const height = this.view.getBoundingRect().height;

    let left = 0;
    let top = 0;
    let right: number = width;
    let bottom: number = height;

    if (this.config.hitSlop.horizontal !== undefined) {
      left -= this.config.hitSlop.horizontal;
      right += this.config.hitSlop.horizontal;
    }

    if (this.config.hitSlop.vertical !== undefined) {
      top -= this.config.hitSlop.vertical;
      bottom += this.config.hitSlop.vertical;
    }

    if (this.config.hitSlop.left !== undefined) {
      left = -this.config.hitSlop.left;
    }

    if (this.config.hitSlop.right !== undefined) {
      right = width + this.config.hitSlop.right;
    }

    if (this.config.hitSlop.top !== undefined) {
      top = -this.config.hitSlop.top;
    }

    if (this.config.hitSlop.bottom !== undefined) {
      bottom = width + this.config.hitSlop.bottom;
    }
    if (this.config.hitSlop.width !== undefined) {
      if (this.config.hitSlop.left !== undefined) {
        right = left + this.config.hitSlop.width;
      } else if (this.config.hitSlop.right !== undefined) {
        left = right - this.config.hitSlop.width;
      }
    }

    if (this.config.hitSlop.height !== undefined) {
      if (this.config.hitSlop.top !== undefined) {
        bottom = top + this.config.hitSlop.height;
      } else if (this.config.hitSlop.bottom !== undefined) {
        top = bottom - this.config.hitSlop.height;
      }
    }

    const rect = this.view.getBoundingRect();
    const offsetX: number = this.tracker.getLastX() - rect.x;
    const offsetY: number = this.tracker.getLastY() - rect.y;

    if (
      offsetX >= left &&
        offsetX <= right &&
        offsetY >= top &&
        offsetY <= bottom
    ) {
      return true;
    }
    return false;
  }

  protected activate(): void {
    if (this.currentState === State.UNDETERMINED || this.currentState === State.BEGAN) {
      this.moveToState(State.ACTIVE)
    }
  }

  protected moveToState(state: State) {
    if (state === this.currentState) return;
    const oldState = this.currentState
    this.currentState = state;
    if (this.tracker.getTrackedPointersCount() > 0 && this.config.needsPointerData && this.isFinished()) {
      this.cancelTouches()
    }
    this.orchestrator.onHandlerStateChange(this, state, oldState)
    this.stateDidChange(state, oldState)
  }

  private isFinished() {
    return (
      this.currentState === State.END ||
        this.currentState === State.FAILED ||
        this.currentState === State.CANCELLED
    );
  }

  private cancelTouches() {
    // TODO
  }

  protected stateDidChange(newState: State, oldState: State) {
  }


  public updateGestureConfig(config: GestureConfig): void {
    this.config = config
  }

  protected resetConfig(): void {
    this.config = this.getDefaultConfig()
  }

  abstract getDefaultConfig(): GestureConfig

  // ----

  public isEnabled(): boolean {
    return Boolean(this.config.enabled)
  }

  public isActive(): boolean {
    return this.isActivated
  }

  public cancel(): void {
    if (
      this.currentState === State.ACTIVE ||
        this.currentState === State.UNDETERMINED ||
        this.currentState === State.BEGAN
    ) {
      this.onCancel();
      this.moveToState(State.CANCELLED);
    }
  }

  protected onCancel(): void {}
  protected onReset(): void {}
  protected resetProgress(): void {}

  public getState(): State {
    return this.currentState
  }

  public sendEvent({newState, oldState}: {
    oldState: State,
    newState: State
  }): void {
    const stateChangeEvent = this.createStateChangeEvent(newState, oldState);
    if (this.lastSentState !== newState) {
      this.lastSentState = newState;
      this.eventDispatcher.onGestureHandlerStateChange(stateChangeEvent);
    }
    if (this.currentState === State.ACTIVE) {
      stateChangeEvent.nativeEvent.oldState = undefined;
      this.eventDispatcher.onGestureHandlerEvent(stateChangeEvent);
    }
  }

  private createStateChangeEvent(newState: State, oldState: State): GestureStateChangeEvent {
    return {
      nativeEvent: {
        numberOfPointers: this.tracker.getTrackedPointersCount(),
        state: newState,
        pointerInside: this.view.isPositionInBounds({
          x: this.tracker.getLastAvgX(),
          y: this.tracker.getLastAvgY(),
        }),
        ...this.transformNativeEvent(),
        handlerTag: this.handlerTag,
        target: this.view.getTag(),
        oldState: newState !== oldState ? oldState : undefined,
      },
      timeStamp: Date.now(),
    };
  }

  protected transformNativeEvent() {
    return {};
  }

  setAwaiting(isAwaiting: boolean): void {
    this.isAwaiting_ = isAwaiting
  }

  shouldWaitForHandlerFailure(handler: GestureHandler): boolean {
    // TODO
    return false
  }

  shouldRequireToWaitForFailure(handler: GestureHandler): boolean {
    // TODO
    return false
  }

  shouldWaitFor(otherHandler: GestureHandler): boolean {
    // TODO
    return false
  }

  reset(): void {
    // TODO
  }

  isAwaiting(): boolean {
    return this.isAwaiting_
  }

  setActive(isActivated: boolean): void {
    this.isActivated = isActivated
  }

  setActivationIndex(activationIndex: number): void {
    // TODO
  }

  setShouldResetProgress(shouldResetProgress: boolean): void {
    // TODO
  }

  fail(): void {
    // TODO
  }

  shouldBeCancelledByOther(otherHandler: GestureHandler): boolean {
    // TODO
    return false
  }

  getTrackedPointersID(): PointerId[] {
    // TODO
    return []
  }

  shouldRecognizeSimultaneously(otherHandler: GestureHandler): boolean {
    // TODO
    return false
  }

  public getPointerType(): PointerType {
    return this.pointerType
  }

  protected setShouldCancelWhenOutside(shouldCancel: boolean) {
    this.shouldCancelWhenOutside = shouldCancel
  }
}
