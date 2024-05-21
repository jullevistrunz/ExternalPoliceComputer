using Rage;

namespace ExternalPoliceComputer
{
    internal static class PREvents
    {
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

        internal static void SubscribeToPREvents()
        {
            PolicingRedefined.API.EventsAPI.OnPedPatDown += Events_patDownPedEvent;
            PolicingRedefined.API.EventsAPI.OnPedStopped += Events_stopPedEvent;
            PolicingRedefined.API.EventsAPI.OnPedArrested += Events_pedArrestedEvent;
        }
        

    }
}