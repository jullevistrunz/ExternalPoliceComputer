using CommonDataFramework.Modules.PedDatabase;
using PolicingRedefined.Interaction.Assets.PedAttributes;
using Rage;
using System;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;

namespace ExternalPoliceComputer {
    internal class AnimationListener {        
        internal static void ListenForAnimationFileChange() {
            FileSystemWatcher watcher = new FileSystemWatcher(Main.DataPath);
            watcher.Filter = "giveCitations.data";
            watcher.EnableRaisingEvents = true;
            watcher.NotifyFilter = NotifyFilters.LastWrite;
            watcher.Changed += (object sender, FileSystemEventArgs e) => {
                if (e.ChangeType != WatcherChangeTypes.Changed) {
                    return;
                }

                string[] file;
                
                try {
                    file = File.ReadAllText($"{Main.DataPath}/giveCitations.data").Split(';');
                } catch (Exception ex) {
                    Game.LogTrivial(ex.ToString());
                    return;
                }

                if (file.Length == 0) return;

                for (int i = 0; i < file.Length; i++) {
                    NameValueCollection fileData = HttpUtility.ParseQueryString(file[i]);

                    Ped ped = Main.Player.GetNearbyPeds(Main.MaxNumberOfNearbyPedsOrVehicles).FirstOrDefault(x => x.GetPedData().FullName == fileData["name"]);

                    if (ped == null) break;

                    Citation c = new Citation(ped, $"{fileData["text"]}", int.Parse(fileData["fine"]), bool.Parse(fileData["isArrestable"]));
                    PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, c);
                }

                File.WriteAllText($"{Main.DataPath}/giveCitations.data", "");
            };
        }
    }
}
