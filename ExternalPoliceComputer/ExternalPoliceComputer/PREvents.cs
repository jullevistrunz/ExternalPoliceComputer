using Rage;

namespace ExternalPoliceComputer {
    internal static class PREvents {
        private static void Events_pedArrestedEvent(Ped ped, Ped officer, bool frontCuffs) {
            DataToClient.AddWorldPed(ped);
        }

        private static void Events_patDownPedEvent(Ped ped) {
            DataToClient.AddWorldPed(ped);
            DataToClient.UpdateCurrentID(ped);
        }

        private static void Events_stopPedEvent(Ped ped) {
            DataToClient.AddWorldPed(ped);
        }

        // private static void Events_askIdEvent(Ped ped) {
        //     AddWorldPed(ped);
        //     UpdateCurrentID(ped);
        // }

        // private static void Events_askDriverLicenseEvent(Ped ped) {
        //     AddWorldPed(ped);
        //     UpdateCurrentID(ped);
        // }
        //
        // private static void Events_askPassengerIdEvent(Vehicle vehicle) {
        //     Ped[] passengers = vehicle.Passengers;
        //     for (int i = 0; i < passengers.Length; i++) {
        //         UpdateCurrentID(passengers[i]);
        //     }
        // }

        internal static void SubscribeToPREvents() {
            PolicingRedefined.API.EventsAPI.OnPedPatDown += Events_patDownPedEvent;
            PolicingRedefined.API.EventsAPI.OnPedStopped += Events_stopPedEvent;
            PolicingRedefined.API.EventsAPI.OnPedArrested += Events_pedArrestedEvent;
            // StopThePed.API.Events.askIdEvent += Events_askIdEvent;
            // StopThePed.API.Events.askDriverLicenseEvent += Events_askDriverLicenseEvent;
            // StopThePed.API.Events.askPassengerIdEvent += Events_askPassengerIdEvent;
        }
    }
}