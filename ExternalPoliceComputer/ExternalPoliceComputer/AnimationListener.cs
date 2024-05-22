using CommonDataFramework.Modules.PedDatabase;
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
            watcher.Filter = "animation.data";
            watcher.EnableRaisingEvents = true;
            watcher.NotifyFilter = NotifyFilters.LastWrite;
            watcher.Changed += (object sender, FileSystemEventArgs e) => {
                if (e.ChangeType != WatcherChangeTypes.Changed) {
                    return;
                }

                NameValueCollection file = new NameValueCollection();

                try {
                    file = HttpUtility.ParseQueryString(File.ReadAllText($"{Main.DataPath}/animation.data"));
                } catch (Exception ex) {
                    Game.LogTrivial(ex.ToString());
                }

                switch (file["type"]) {
                    case "giveCitation":
                        Game.LogTrivial(file["name"]);

                        Ped ped = Main.Player.GetNearbyPeds(Main.MaxNumberOfNearbyPedsOrVehicles).FirstOrDefault(x => x.GetPedData().FullName == file["name"]);

                        if (ped == null) break;

                        Game.LogTrivial(ped.GetPedData().FullName);

                        PolicingRedefined.Interaction.Assets.PedAttributes.Citation citation = new PolicingRedefined.Interaction.Assets.PedAttributes.Citation(ped, file["text"], int.Parse(file["fine"]), bool.Parse(file["isArrestable"]));
                        PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, citation);
                        break;
                }
            };
        }
    }
}
