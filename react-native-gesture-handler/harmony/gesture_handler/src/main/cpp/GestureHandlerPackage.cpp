#pragma once
#include "GestureHandlerPackage.h"
#include "RNOH/RNInstanceCAPI.h"
#include "RNGestureHandlerButtonComponentInstance.h"
#include "RNGestureHandlerRootViewComponentInstance.h"
#include "RNOH/ArkTSTurboModule.h"
#include "RNGestureHandlerModule.h"
#include "RNGestureHandlerButtonComponentDescriptor.h"
#include "RNGestureHandlerRootViewComponentDescriptor.h"
#include "RNGestureHandlerButtonJSIBinder.h"
#include "RNGestureHandlerRootViewJSIBinder.h"

using namespace rnoh;
using namespace facebook;

class GestureHandlerTurboModuleFactoryDelegate : public TurboModuleFactoryDelegate {
public:
    SharedTurboModule createTurboModule(Context ctx, const std::string &name) const override {
        if (name == "RNGestureHandlerModule") {
            return std::make_shared<RNGestureHandlerModule>(ctx, name);
        }
        return nullptr;
    };
};

class RNGHEventEmitRequestHandler : public EventEmitRequestHandler {
    void handleEvent(EventEmitRequestHandler::Context const &ctx) override {
        auto eventEmitter = ctx.shadowViewRegistry->getEventEmitter<facebook::react::ViewEventEmitter>(ctx.tag);
        if (eventEmitter == nullptr) {
            return;
        }
        if (ctx.eventName == "onGestureHandlerEvent") {
            eventEmitter->dispatchEvent(ctx.eventName, ArkJS(ctx.env).getDynamic(ctx.payload));
        }
    }
};

class RNOHCorePackageComponentInstanceFactoryDelegate : public ComponentInstanceFactoryDelegate {
public:
    using ComponentInstanceFactoryDelegate::ComponentInstanceFactoryDelegate;

    ComponentInstance::Shared create(ComponentInstance::Context ctx) override {
        if (ctx.componentName == "RNGestureHandlerButton") {
            return std::make_shared<RNGestureHandlerButtonComponentInstance>(ctx);
        } else if (ctx.componentName == "RNGestureHandlerRootView") {
            return std::make_shared<RNGestureHandlerRootViewComponentInstance>(ctx);
        }
        return nullptr;
    }
};

std::unique_ptr<TurboModuleFactoryDelegate> GestureHandlerPackage::createTurboModuleFactoryDelegate() {
    return std::make_unique<GestureHandlerTurboModuleFactoryDelegate>();
}

std::vector<react::ComponentDescriptorProvider> GestureHandlerPackage::createComponentDescriptorProviders() {
    return {
        react::concreteComponentDescriptorProvider<react::RNGestureHandlerRootViewComponentDescriptor>(),
        react::concreteComponentDescriptorProvider<react::RNGestureHandlerButtonComponentDescriptor>(),
    };
}

ComponentJSIBinderByString GestureHandlerPackage::createComponentJSIBinderByName() {
    return {
        {"RNGestureHandlerButton", std::make_shared<RNGestureHandlerButtonJSIBinder>()},
        {"RNGestureHandlerRootView", std::make_shared<RNGestureHandlerRootViewJSIBinder>()},
    };
};

EventEmitRequestHandlers GestureHandlerPackage::createEventEmitRequestHandlers() {
    return {
        std::make_shared<RNGHEventEmitRequestHandler>(),
    };
}

ComponentInstanceFactoryDelegate::Shared GestureHandlerPackage::createComponentInstanceFactoryDelegate() {
    return std::make_shared<RNOHCorePackageComponentInstanceFactoryDelegate>();
}

class ScrollLockerArkTSMessageHandler : public ArkTSMessageHandler {
public:
    void handleArkTSMessage(const Context &ctx) override {
        if (ctx.messageName == "RNGH::SET_NATIVE_RESPONDERS_BLOCK") {
            auto targetComponentInstanceTag = ctx.messagePayload["targetTag"].asDouble();
            auto shouldBlock = ctx.messagePayload["shouldBlock"].asBool();
            auto rnInstance = ctx.rnInstance.lock();
            if (rnInstance != nullptr) {
                auto rnInstanceCAPI = std::dynamic_pointer_cast<RNInstanceCAPI>(rnInstance);
                if (rnInstanceCAPI != nullptr) {
                    auto tmpComponentInstance = rnInstanceCAPI->findComponentInstanceByTag(targetComponentInstanceTag);
                    while (tmpComponentInstance != nullptr) {
                        tmpComponentInstance->setNativeResponderBlocked(shouldBlock, "RNGH");
                        tmpComponentInstance = tmpComponentInstance->getParent().lock();
                    }
                }
            }
        }
    };
};

std::vector<ArkTSMessageHandler::Shared> GestureHandlerPackage::createArkTSMessageHandlers() {
    return {std::make_shared<ScrollLockerArkTSMessageHandler>()};
}
