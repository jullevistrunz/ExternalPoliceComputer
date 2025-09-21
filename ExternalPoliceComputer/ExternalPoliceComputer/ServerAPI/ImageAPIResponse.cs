using System.IO;
using System.Net;

namespace ExternalPoliceComputer.ServerAPI {
    internal class ImageAPIResponse : APIResponse {
        internal ImageAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/image/".Length);
            if (string.IsNullOrEmpty(path)) return;
            if (path.EndsWith(".png") || path.EndsWith(".jpg")) path = path.Substring(0, path.Length - 4);
            if (path.EndsWith(".jpeg")) path = path.Substring(0, path.Length - ".jpeg".Length);

            if (path == "defaultHeadshot") {
                buffer = File.ReadAllBytes("EPC/img/defaultHeadshot.png");
                status = 200;
                contentType = "image/png";
            } else if (path == "map") {
                buffer = File.ReadAllBytes("EPC/img/map.jpeg");
                status = 200;
                contentType = "image/jpeg";
            }
        }
    }
}
