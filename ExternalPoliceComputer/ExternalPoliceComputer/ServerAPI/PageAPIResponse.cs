using System.IO;
using System.Net;

namespace ExternalPoliceComputer.ServerAPI {
    internal class PageAPIResponse : APIResponse {
        internal PageAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/page/".Length);
            if (string.IsNullOrEmpty(path)) return;
            if (path.EndsWith(".html")) path = path.Substring(0, path.Length - ".html".Length);

            if (path == "pedSearch") {
                buffer = File.ReadAllBytes("EPC/main/pages/pedSearch.html");
                status = 200;
                contentType = "text/html";
            } else if (path == "vehicleSearch") {
                buffer = File.ReadAllBytes("EPC/main/pages/vehicleSearch.html");
                status = 200;
                contentType = "text/html";
            } else if (path == "reports") {
                buffer = File.ReadAllBytes("EPC/main/pages/reports.html");
                status = 200;
                contentType = "text/html";
            }
        }
    }
}
