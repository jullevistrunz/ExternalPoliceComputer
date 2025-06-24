using Rage;

namespace ExternalPoliceComputer.EventListeners {
    internal static class PREvents {
        private static void Events_OnPedArrested(Ped ped, Ped officer, bool frontCuffs) {
            // DataToClient.AddWorldPed(ped);
        }

        private static void Events_OnPedPatDown(Ped ped) {
            // DataToClient.AddWorldPed(ped);
            // DataToClient.UpdateCurrentID(ped);
        }

        private static void Events_OnPedStopped(Ped ped) {
            // DataToClient.AddWorldPed(ped);
        }

        private static void Events_OnIdentificationGiven(Ped ped) {
            // DataToClient.AddWorldPed(ped);
            // DataToClient.UpdateCurrentID(ped);
        }

        internal static void SubscribeToPREvents() {
            PolicingRedefined.API.EventsAPI.OnPedPatDown += Events_OnPedPatDown;
            PolicingRedefined.API.EventsAPI.OnPedStopped += Events_OnPedStopped;
            PolicingRedefined.API.EventsAPI.OnPedArrested += Events_OnPedArrested;
            PolicingRedefined.API.EventsAPI.OnIdentificationGiven += Events_OnIdentificationGiven;
            PolicingRedefined.API.EventsAPI.OnDriverIdentificationGiven += Events_OnIdentificationGiven;
            PolicingRedefined.API.EventsAPI.OnOccupantIdentificationGiven += Events_OnIdentificationGiven;
        }
    }
}