using System.IO;
using System.Net;


namespace ExternalPoliceComputer.ServerAPI {
    internal class StyleAPIResponse : APIResponse {
        internal StyleAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/style/".Length);
            if (string.IsNullOrEmpty(path)) return;
            if (path.EndsWith(".css")) path = path.Substring(0, path.Length - ".css".Length);

            if (path == "index") {
                buffer = File.ReadAllBytes("EPC/main/styles/index.css");
                status = 200;
                contentType = "text/css";
            } else if (path == "root") {
                buffer = File.ReadAllBytes("EPC/main/styles/root.css");
                status = 200;
                contentType = "text/css";
            } else if (path == "pedSearch") {
                buffer = File.ReadAllBytes("EPC/main/styles/pedSearch.css");
                status = 200;
                contentType = "text/css";
            } else if (path == "vehicleSearch") {
                buffer = File.ReadAllBytes("EPC/main/styles/vehicleSearch.css");
                status = 200;
                contentType = "text/css";
            } else if (path == "reports") {
                buffer = File.ReadAllBytes("EPC/main/styles/reports.css");
                status = 200;
                contentType = "text/css";
            }
        }
    }
}
