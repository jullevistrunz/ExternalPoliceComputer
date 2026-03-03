using ExternalPoliceComputer.EventListeners;
using ExternalPoliceComputer.Utility;
using System.Runtime.CompilerServices;

namespace ExternalPoliceComputer {
    public static class Functions {

        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void SendMessage(string message) {
            CalloutEvents.SendAdditionalMessage(message);
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void AddCautionToPed(string name, string message) {
            Helper.Log("A plugin used a deprecated function (AddCautionToPed).", true);
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void AddCautionToCar(string licensePlate, string message) {
            Helper.Log("A plugin used a deprecated function (AddCautionToCar).", true);
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void RemoveCautionFromPed(string name, string message) {
            Helper.Log("A plugin used a deprecated function (RemoveCautionFromPed).", true);
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        public static void RemoveCautionFromCar(string licensePlate, string message) {
            Helper.Log("A plugin used a deprecated function (RemoveCautionFromCar).", true);
        }
    }
}