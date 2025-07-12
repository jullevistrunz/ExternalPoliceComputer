using System.IO;
using System.Net;
using static ExternalPoliceComputer.Setup.SetupController;

namespace ExternalPoliceComputer.ServerAPI {
    internal class ScriptAPIResponse : APIResponse {
        internal ScriptAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/script/".Length);
            if (string.IsNullOrEmpty(path)) return;
            if (path.EndsWith(".js")) path = path.Substring(0, path.Length - ".js".Length);

            if (path == "index") {
                buffer = File.ReadAllBytes($"{EPCPath}/main/scripts/index.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "root") {
                buffer = File.ReadAllBytes($"{EPCPath}/main/scripts/root.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "pluginAPI") {
                buffer = File.ReadAllBytes($"{EPCPath}/main/scripts/pluginAPI.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "pedSearch") {
                buffer = File.ReadAllBytes($"{EPCPath}/main/scripts/pedSearch.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "vehicleSearch") {
                buffer = File.ReadAllBytes($"{EPCPath}/main/scripts/vehicleSearch.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "reports") {
                buffer = File.ReadAllBytes($"{EPCPath}/main/scripts/reports.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "shiftHistory") {
                buffer = File.ReadAllBytes($"{EPCPath}/main/scripts/shiftHistory.js");
                status = 200;
                contentType = "application/js";
            }
        }
    }
}
