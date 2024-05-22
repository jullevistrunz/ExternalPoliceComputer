using LSPD_First_Response.Mod.API;
using Rage;

namespace ExternalPoliceComputer
{
    internal static class LSPDFREvents
    {
        private static void Events_OnPedPresentedId(Ped ped, LHandle pullover, LHandle pedInteraction) {
            DataToClient.AddWorldPed(ped);
            DataToClient.UpdateCurrentID(ped);
        }
        
        private static void Events_OnPedArrested(Ped suspect, Ped arrestingOfficer) {
            DataToClient.AddWorldPed(suspect);
        }

        private static void Events_OnPedFrisked(Ped suspect, Ped friskingOfficer) {
            DataToClient.AddWorldPed(suspect);
            DataToClient.UpdateCurrentID(suspect);
        }

        private static void Events_OnPedStopped(Ped ped) {
            DataToClient.AddWorldPed(ped);
        }

        internal static void Events_OnPulloverStarted(LHandle handle) {
            DataToClient.UpdateWorldPeds();
            DataToClient.UpdateWorldCars();
        }

        internal static void Events_OnPursuitEnded(LHandle handle) {
            DataToClient.UpdateWorldPeds();
            DataToClient.UpdateWorldCars();
        }

        internal static void SubscribeToFREvents()
        {
            LSPD_First_Response.Mod.API.Events.OnPedPresentedId += Events_OnPedPresentedId;
            LSPD_First_Response.Mod.API.Events.OnPedArrested += Events_OnPedArrested;
            LSPD_First_Response.Mod.API.Events.OnPedFrisked += Events_OnPedFrisked;
            LSPD_First_Response.Mod.API.Events.OnPedStopped += Events_OnPedStopped;
        }
    }
}