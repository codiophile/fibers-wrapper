const Future = require('fibers/future')
const Fiber = require('fibers')

function fiberizeObject(originalTarget) {
    const newTarget = { ___proxyTarget: originalTarget }
    return new Proxy(
        newTarget,
        {
            get: function (target, property, receiver) {
                const original = originalTarget[property]
                return wrap(original)
            }
        }
    )
}

function fiberizeFunction(target) {
    return new Proxy(
        target,
        {
            apply: function (target, thisArg, argumentsList) {
                const result = target.apply(thisArg, argumentsList)
                if (Fiber.current) {
                    return wrap(Future.fromPromise(Promise.resolve(result)).wait())
                } else {
                    return result
                }
            }
        }
    )
}

function wrap(original) {
    switch(typeof original) {
        case 'function':
            return fiberizeFunction(original)
        case 'object':
            return fiberizeObject(original)
        default:
            return original
    }
}

module.exports = wrap
