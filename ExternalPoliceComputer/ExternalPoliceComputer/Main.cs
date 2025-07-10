using LSPD_First_Response.Mod.API;
using Rage;
using System.IO;
using System.Threading;
using static ExternalPoliceComputer.Setup.SetupController;
using static ExternalPoliceComputer.Utility.Helper;

namespace ExternalPoliceComputer {
    internal class Main : Plugin {

        public static readonly string Version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version.ToString();

        internal static Ped Player => Game.LocalPlayer.Character;
        internal static bool usePR = false;
        internal static bool useCI = false;

        public override void Initialize() {
            LSPD_First_Response.Mod.API.Functions.OnOnDutyStateChanged += Functions_OnOnDutyStateChanged;
            Game.LogTrivial("ExternalPoliceComputer has been initialized.");
        }

        public override void Finally() {
            Data.DataController.EndCurrentShift();
            Server.Stop();
            Game.DisplayNotification(GetLanguage().inGame.unloaded);
        }

        private static void Functions_OnOnDutyStateChanged(bool OnDuty) {
            if (OnDuty) {
                GameFiber.StartNew(() => {
                    if (!Directory.Exists(EPCPath)) {
                        Game.DisplayNotification("ExternalPoliceComputer failed to load. Missing EPC files. Please reinstall EPC and follow the installation instructions.");
                        Game.LogTrivial("ExternalPoliceComputer: [Error] Loading aborted. Missing EPC files.");
                        return;
                    }

                    if (!DependencyCheck.IsNewtonsoftJsonAvailable()) {
                        Game.DisplayNotification("ExternalPoliceComputer failed to load. Couldn't find Newtonsoft.Json.");
                        Log("Loading aborted. Couldn't find Newtonsoft.Json.", true, LogSeverity.Error);
                        return;
                    }

                    if (!DependencyCheck.IsCIAPIAvailable()) {
                        Game.DisplayNotification(GetLanguage().inGame.errorMissingCIAPI);
                        Log("Loading aborted. Couldn't find CalloutInterfaceAPI.", true, LogSeverity.Error);
                        return;
                    }

                    if (!DependencyCheck.IsCDFAvailable()) {
                        Game.DisplayNotification(GetLanguage().inGame.errorMissingCDF);
                        Log("Loading aborted. Couldn't find CommonDataFramework.", true, LogSeverity.Error);
                        return;
                    }

                    GameFiber.StartNew(() => {
                        GameFiber.WaitUntil(CommonDataFramework.API.CDFFunctions.IsPluginReady, 30000);
                        if (!CommonDataFramework.API.CDFFunctions.IsPluginReady()) {
                            Server.Stop();
                            Game.DisplayNotification(GetLanguage().inGame.errorCDFLoadingAborted);
                            Log("Loading aborted. CommonDataFramework didn't load.", true, LogSeverity.Error);
                            return;
                        }

                        SetupDirectory();

                        Thread serverThread = new Thread(Server.Start) {
                            IsBackground = true
                        };
                        serverThread.Start();

                        useCI = DependencyCheck.IsCIAvailable();
                        usePR = DependencyCheck.IsPRAvailable();

                        Log($"CI: {useCI}", true, useCI ? LogSeverity.Info : LogSeverity.Warning);
                        Log($"PR: {usePR}", true, usePR ? LogSeverity.Info : LogSeverity.Warning);

                        if (useCI) EventListeners.CalloutEvents.AddCalloutEventWithCI();

                        if (usePR) {
                            EventListeners.PREvents.SubscribeToPREvents();
                        } else {
                            EventListeners.LSPDFREvents.SubscribeToLSPDFREvents();
                        }

                        Game.DisplayNotification(GetLanguage().inGame.loaded);
                    });
                });
            } 
        }
    }
}