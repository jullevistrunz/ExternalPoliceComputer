using System.IO;
using System.Net;

namespace ExternalPoliceComputer.ServerAPI {
    internal class ScriptAPIResponse : APIResponse {
        internal ScriptAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/script/".Length);
            if (string.IsNullOrEmpty(path)) return;
            if (path.EndsWith(".js")) path = path.Substring(0, path.Length - ".js".Length);

            if (path == "index") {
                buffer = File.ReadAllBytes("EPC/main/scripts/index.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "root") {
                buffer = File.ReadAllBytes("EPC/main/scripts/root.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "pluginAPI") {
                buffer = File.ReadAllBytes("EPC/main/scripts/pluginAPI.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "pedSearch") {
                buffer = File.ReadAllBytes("EPC/main/scripts/pedSearch.js");
                status = 200;
                contentType = "application/js";
            } else if (path == "vehicleSearch") {
                buffer = File.ReadAllBytes("EPC/main/scripts/vehicleSearch.js");
                status = 200;
                contentType = "application/js";
            }
        }
    }
}
