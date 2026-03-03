using ExternalPoliceComputer.Data;
using Rage;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace ExternalPoliceComputer.EventListeners {
    internal static class PREvents {
        private static bool subscribed;
        private static readonly string[] eventNames = {
            "OnPedStopped",
            "OnPedPatDown",
            "OnIdentificationGiven",
            "OnDriverIdentificationGiven",
            "OnOccupantIdentificationGiven",
            "OnRequestPedCheck",
            "OnPedRanThroughDispatch",
            "OnPedArrested",
            "OnPedReleased"
        };

        internal static void SubscribeToPREvents() {
            if (subscribed) return;

            try {
                Type eventsApiType = Type.GetType("PolicingRedefined.API.EventsAPI, PolicingRedefined");
                if (eventsApiType == null) return;

                foreach (string eventName in eventNames) {
                    EventInfo eventInfo = eventsApiType.GetEvent(eventName, BindingFlags.Public | BindingFlags.Static);
                    if (eventInfo == null) continue;

                    Delegate handler = CreateForwardingDelegate(eventInfo.EventHandlerType);
                    eventInfo.AddEventHandler(null, handler);
                }

                subscribed = true;
            } catch (Exception e) {
                Game.LogTrivial($"ExternalPoliceComputer: [Warning] Failed to subscribe to PR events: {e.Message}");
            }
        }

        private static Delegate CreateForwardingDelegate(Type delegateType) {
            MethodInfo invokeMethod = delegateType.GetMethod("Invoke");
            ParameterInfo[] parameters = invokeMethod.GetParameters();
            ParameterExpression[] parameterExpressions = parameters
                .Select(parameter => Expression.Parameter(parameter.ParameterType, parameter.Name))
                .ToArray();

            NewArrayExpression argsArrayExpression = Expression.NewArrayInit(
                typeof(object),
                parameterExpressions.Select(parameterExpression => Expression.Convert(parameterExpression, typeof(object))));

            MethodCallExpression body = Expression.Call(
                typeof(PREvents).GetMethod(nameof(HandlePREvent), BindingFlags.NonPublic | BindingFlags.Static),
                argsArrayExpression);

            return Expression.Lambda(delegateType, body, parameterExpressions).Compile();
        }

        private static void HandlePREvent(object[] args) {
            if (args == null || args.Length == 0) return;

            foreach (object value in args) {
                ResolvePedFromValue(value);
            }
        }

        private static void ResolvePedFromValue(object value) {
            if (value == null) return;

            if (value is Ped ped) {
                DataController.ResolvePedForReEncounter(ped);
                return;
            }

            Type valueType = value.GetType();
            IEnumerable<PropertyInfo> pedProperties = valueType
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(property => property.CanRead && typeof(Ped).IsAssignableFrom(property.PropertyType));

            foreach (PropertyInfo property in pedProperties) {
                try {
                    object pedValue = property.GetValue(value);
                    if (pedValue is Ped nestedPed) {
                        DataController.ResolvePedForReEncounter(nestedPed);
                    }
                } catch {
                    // Ignore malformed event payloads and continue.
                }
            }
        }
    }
}
