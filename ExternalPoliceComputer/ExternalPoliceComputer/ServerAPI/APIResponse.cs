using ExternalPoliceComputer.Setup;
using Newtonsoft.Json;
using System.IO;
using System.Net;
using System.Text;

namespace ExternalPoliceComputer.ServerAPI {
    internal class APIResponse {
        internal byte[] buffer = Encoding.UTF8.GetBytes("404 - Not found");
        internal int status = 404;
        internal string contentType = "text/plain";

        internal APIResponse(HttpListenerRequest req) {
            if (req == null) return;
            string path = req.Url.AbsolutePath;
            if (path == "/") {
                buffer = File.ReadAllBytes("EPC/main/pages/index.html");
                status = 200;
                contentType = "text/html";
            } else if (path == "/favicon") {
                buffer = File.ReadAllBytes("EPC/img/favicon.png");
                status = 200;
                contentType = "image/png";
            } else if (path == "/customization") {
                buffer = File.ReadAllBytes("EPC/customization/index.html");
                status = 200;
                contentType = "text/html";
            } else if (path == "/version") {
                buffer = Encoding.UTF8.GetBytes(Main.Version);
                status = 200;
                contentType = "text/plain";
            } else if (path == "/config") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(SetupController.GetConfig()));
                status = 200;
                contentType = "text/json";
            } else if (path == "/language") {
                buffer = Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(SetupController.GetLanguage()));
                status = 200;
                contentType = "text/json";
            }
        }
    }
}
