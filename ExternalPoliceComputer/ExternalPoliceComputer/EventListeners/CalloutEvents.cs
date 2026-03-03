// Ignore Spelling: Callsign Coords

using ExternalPoliceComputer.Data.Reports;
using ExternalPoliceComputer.Utility;
using LSPD_First_Response.Mod.API;
using LSPD_First_Response.Mod.Callouts;
using System;
using System.Collections.Generic;

namespace ExternalPoliceComputer.EventListeners {
    public class CalloutEvents {
        internal static CalloutInformation CalloutInfo;

        public class CalloutInformation {
            public string Name;
            public string Description;
            public string Message;
            public string Advisory;
            public string Callsign;
            public string Agency;
            public string Priority;
            public Location Location;
            public float[] Coords = new float[2];
            public CalloutAcceptanceState AcceptanceState;
            public DateTime DisplayedTime;
            public DateTime? AcceptedTime = null;
            public DateTime? FinishedTime = null;
            public List<string> AdditionalMessages = new List<string>();

            internal CalloutInformation(Callout callout) {
                Name = callout.FriendlyName;
                Agency = Helper.GetAgencyNameFromScriptName(LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName()) ?? LSPD_First_Response.Mod.API.Functions.GetCurrentAgencyScriptName();
                // thank you opus49
                if (callout.ScriptInfo is CalloutInterfaceAPI.CalloutInterfaceAttribute calloutInterfaceInfo) {
                    if (calloutInterfaceInfo.Agency.Length > 0) {
                        Agency = calloutInterfaceInfo.Agency;
                    }
                    if (calloutInterfaceInfo.Priority.Length > 0) {
                        Priority = calloutInterfaceInfo.Priority;
                    }
                    Description = calloutInterfaceInfo.Description;
                    Name = calloutInterfaceInfo.Name;
                }
                Message = callout.CalloutMessage;
                Advisory = callout.CalloutAdvisory;
                Callsign = DependencyCheck.IsIPTCommonAvailable() ? Helper.GetCallSignFromIPTCommon() : null;
                Location = new Location(callout.CalloutPosition);
                Coords[0] = callout.CalloutPosition.X;
                Coords[1] = callout.CalloutPosition.Y;
                AcceptanceState = callout.AcceptanceState;
                DisplayedTime = DateTime.Now;
            }
        }

        internal delegate void CalloutEventHandler(CalloutInformation calloutInfo);
        internal static event CalloutEventHandler OnCalloutEvent;

        internal static void AddCalloutEventWithCI() {
            LSPD_First_Response.Mod.API.Events.OnCalloutDisplayed += Events_OnCalloutDisplayed;
            LSPD_First_Response.Mod.API.Events.OnCalloutFinished += Events_OnCalloutFinished;
            LSPD_First_Response.Mod.API.Events.OnCalloutAccepted += Events_OnCalloutAccepted;
            void Events_OnCalloutDisplayed(LHandle handle) {
                if (handle == null) return;
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);

                CalloutInfo = new CalloutInformation(callout);

                OnCalloutEvent?.Invoke(CalloutInfo);
            }

            void Events_OnCalloutAccepted(LHandle handle) {
                if (handle == null || CalloutInfo == null) return;
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);

                CalloutInfo.AcceptanceState = callout.AcceptanceState;
                CalloutInfo.AcceptedTime = DateTime.Now;

                OnCalloutEvent?.Invoke(CalloutInfo);
            }

            void Events_OnCalloutFinished(LHandle handle) {
                if (handle == null || CalloutInfo == null) return;
                Callout callout = CalloutInterface.API.Functions.GetCalloutFromHandle(handle);

                CalloutInfo.AcceptanceState = callout.AcceptanceState;
                CalloutInfo.FinishedTime = DateTime.Now;

                OnCalloutEvent?.Invoke(CalloutInfo);
            }
        }

        internal static void SendAdditionalMessage(string message) {
            if (CalloutInfo != null) {
                CalloutInfo.AdditionalMessages.Add(message);
                OnCalloutEvent?.Invoke(CalloutInfo);
            }
        }
    }
}