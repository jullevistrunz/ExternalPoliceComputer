using LSPD_First_Response.Engine.Scripting;
using LSPD_First_Response.Mod.API;
using LSPD_First_Response.Mod.Callouts;
using Rage;
using System;
using System.Collections.Generic;
using System.IO;

namespace ExternalPoliceComputer {
    internal class CalloutEvents {
        internal static void AddCalloutEventWithCI() {
            LSPD_First_Response.Mod.API.Events.OnCalloutDisplayed += Events_OnCalloutDisplayed;
            LSPD_First_Response.Mod.API.Events.OnCalloutFinished += Events_OnCalloutFinished;
            LSPD_First_Response.Mod.API.Events.OnCalloutAccepted += Events_OnCalloutAccepted;
            void Events_OnCalloutDisplayed(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                string agency = LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName();
                string priority = "default";
                string description = "";
                string name = callout.FriendlyName;
                string callsign = IPT.Common.Handlers.PlayerHandler.GetCallsign();

                // opus49 came up with this (and I just modified it a bit)
                if (callout.ScriptInfo is CalloutInterfaceAPI.CalloutInterfaceAttribute calloutInterfaceInfo) {
                    if (calloutInterfaceInfo.Agency.Length > 0) {
                        agency = calloutInterfaceInfo.Agency;
                    }
                    if (calloutInterfaceInfo.Priority.Length > 0) {
                        priority = calloutInterfaceInfo.Priority;
                    }
                    description = Main.MakeStringWorkWithMyStupidQueryStrings(calloutInterfaceInfo.Description);
                    name = Main.MakeStringWorkWithMyStupidQueryStrings(calloutInterfaceInfo.Name);
                }

                string street = World.GetStreetName(World.GetStreetHash(callout.CalloutPosition));
                WorldZone zone = LSPD_First_Response.Mod.API.Functions.GetZoneAtPosition(callout.CalloutPosition);

                string calloutData = DataToClient.PrintObjects(
                    ("id", new Random().Next(10000, 100000).ToString()),
                    ("name", name),
                    ("description", description),
                    ("message", Main.MakeStringWorkWithMyStupidQueryStrings(callout.CalloutMessage)),
                    ("advisory", Main.MakeStringWorkWithMyStupidQueryStrings(callout.CalloutAdvisory)),
                    ("callsign", callsign),
                    ("agency", agency),
                    ("priority", priority),
                    ("postal", CalloutInterface.API.Functions.GetPostalCode(callout.CalloutPosition)),
                    ("street", street),
                    ("area", zone.RealAreaName),
                    ("county", zone.County.ToString()),
                    ("position", callout.CalloutPosition.ToString()),
                    ("acceptanceState", callout.AcceptanceState.ToString()),
                    ("displayedTime", DateTime.Now.ToLocalTime().ToString("s")),
                    ("additionalMessage", "")
                    );

                File.WriteAllText($"{Main.DataPath}/callout.data", calloutData);
            }

            void Events_OnCalloutAccepted(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                DataToClient.UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                DataToClient.UpdateCalloutData("acceptedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }

            void Events_OnCalloutFinished(LHandle handle) {
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);
                DataToClient.UpdateCalloutData("acceptanceState", callout.AcceptanceState.ToString());
                DataToClient.UpdateCalloutData("finishedTime", DateTime.Now.ToLocalTime().ToString("s"));
            }
        }
    }
}
