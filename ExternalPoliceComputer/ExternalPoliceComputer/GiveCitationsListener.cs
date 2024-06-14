using CommonDataFramework.Modules.PedDatabase;
using PolicingRedefined.Interaction.Assets.PedAttributes;
using Rage;
using System;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;

namespace ExternalPoliceComputer {
    internal class GiveCitationsListener {
        internal static FileSystemWatcher watcher;
        internal static void ListenForAnimationFileChange() {
            watcher = new FileSystemWatcher(Main.DataPath);
            watcher.Filter = "giveCitations.data";
            watcher.EnableRaisingEvents = true;
            watcher.NotifyFilter = NotifyFilters.LastWrite;
            watcher.Changed += (object sender, FileSystemEventArgs e) => {
                if (e.ChangeType != WatcherChangeTypes.Changed) {
                    return;
                }

                string[] file = null;
                
                try {
                    file = File.ReadAllText($"{Main.DataPath}/giveCitations.data").Split(',');
                } catch (Exception ex) {
                    Game.LogTrivial(ex.ToString());
                    return;
                }

                if (file == null || file.Length < 1) return;

                for (int i = 0; i < file.Length; i++) {
                    NameValueCollection fileData = HttpUtility.ParseQueryString(file[i]);

                    Ped[] nearbyPeds = Main.Player.GetNearbyPeds(Main.MaxNumberOfNearbyPedsOrVehicles);

                    Ped ped = null;
                    for (int j = 0; j < nearbyPeds.Length; j++) {
                        if (nearbyPeds[j].Exists() && nearbyPeds[j].IsHuman && nearbyPeds[j].GetPedData().FullName == fileData["name"]) {
                            ped = nearbyPeds[j];
                            break;
                        }
                    }

                    if (ped == null) break;

                    Citation c = new Citation(ped, $"{fileData["text"]}", int.Parse(fileData["fine"]), bool.Parse(fileData["isArrestable"]));
                    PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, c);
                }

                watcher.EnableRaisingEvents = false;
                File.WriteAllText($"{Main.DataPath}/giveCitations.data", "");
                watcher.EnableRaisingEvents = true;
            };
        }
    }
}
