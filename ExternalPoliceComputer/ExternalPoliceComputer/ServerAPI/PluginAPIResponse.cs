using System.Net;

namespace ExternalPoliceComputer.ServerAPI {
    internal class PluginAPIResponse : APIResponse {
        internal PluginAPIResponse(HttpListenerRequest req) : base(null) {
            string path = req.Url.AbsolutePath.Substring("/plugin/".Length);
        }
    }
}
