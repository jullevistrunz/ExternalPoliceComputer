using CommonDataFramework.Modules.PedDatabase;
using Rage;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;

namespace ExternalPoliceComputer {
    internal class AnimationListener {
        internal static Dictionary<Ped, PedCitations> data = new Dictionary<Ped, PedCitations>();
        
        internal static void ListenForAnimationFileChange() {
            FileSystemWatcher watcher = new FileSystemWatcher(Main.DataPath);
            watcher.Filter = "animation.data";
            watcher.EnableRaisingEvents = true;
            watcher.NotifyFilter = NotifyFilters.LastWrite;
            watcher.Changed += (object sender, FileSystemEventArgs e) => {
                if (e.ChangeType != WatcherChangeTypes.Changed) {
                    return;
                }

                string[] file;
                
                try {
                    file = File.ReadAllText($"{Main.DataPath}/animation.data").Split(';');
                } catch (Exception ex) {
                    Game.LogTrivial(ex.ToString());
                    return;
                }

                for (int i = 0; i < file.Length; i++) {
                    NameValueCollection fileData = HttpUtility.ParseQueryString(file[i]);

                    switch (fileData["type"]) {
                        case "giveCitation":
                            Game.LogTrivial(fileData["name"]);

                            Ped ped = Main.Player.GetNearbyPeds(Main.MaxNumberOfNearbyPedsOrVehicles).FirstOrDefault(x => x.GetPedData().FullName == fileData["name"]);

                            if (ped == null) break;

                            Game.LogTrivial(ped.GetPedData().FullName);

                            AddCitationToPed(ped, fileData["text"], int.Parse(fileData["fine"]), bool.Parse(fileData["isArrestable"]));

                            if (data.ContainsKey(ped)) data[ped].TransferCitations(ped);

                            break;
                    }
                }

                File.WriteAllText($"{Main.DataPath}/animation.data", "");
            };
        }
        
        internal static void AddCitationToPed(Ped ped, string text, int fine, bool isArrestable) {
            if (data.ContainsKey(ped)) {
                data[ped].AddCitation(text, fine, isArrestable);
            }
            else {
                data.Add(ped, new PedCitations());
                data[ped].AddCitation(text, fine, isArrestable);
            }
        }
    }
}
