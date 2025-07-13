using ExternalPoliceComputer.ServerAPI;
using Rage;
using System;
using System.IO;
using System.Net;
using System.Threading;
using static ExternalPoliceComputer.Utility.Helper;

namespace ExternalPoliceComputer {
    internal class Server {
        internal static bool RunServer;

        private static HttpListener listener;

        internal static void Start() {
            listener?.Close();
            RunServer = true;
            listener = new HttpListener();
            listener.Prefixes.Add($"http://+:{Setup.SetupController.GetConfig().port}/");
            listener.Start();
            string fullIp = $"http://{GetLocalIPAddress()}:{Setup.SetupController.GetConfig().port}";
            string fullName = $"http://{Environment.MachineName}:{Setup.SetupController.GetConfig().port}";
            Game.DisplayNotification($"{Setup.SetupController.GetLanguage().inGame.listeningOnIpAddress}{fullIp}");
            Game.DisplayNotification($"{Setup.SetupController.GetLanguage().inGame.listeningOnIpAddress}{fullName}");
            File.WriteAllText(Setup.SetupController.IpAddressesPath, $"{fullIp}\n{fullName}");

            new Thread(() => {
                while (RunServer) {
                    try {
                        var context = listener.GetContext();
                        HandleRequest(context);
                    } catch (HttpListenerException e) {
                        if (RunServer) Log($"HTTP Listener Exception: {e.Message}", true, LogSeverity.Error);
                    } catch (Exception e) {
                        Log($"Server Exception: {e.Message}", true, LogSeverity.Error);
                    }
                }
                listener.Close();
            }) { IsBackground = true }.Start();
        }

        private static void HandleRequest(HttpListenerContext ctx) { 
            if (ctx.Request.IsWebSocketRequest && ctx.Request.RawUrl == "/ws") {
                WebSocketHandler.HandleWebSocket(ctx);
                return;
            }

            HttpListenerRequest req = ctx.Request;
            HttpListenerResponse res = ctx.Response;

            APIResponse apiRes = GetAPIResponse(req);

            Log($"APIResponse: status={apiRes?.status}, contentType={apiRes?.contentType}, bufferLength={apiRes?.buffer?.Length}", true, LogSeverity.Info);


            byte[] buffer = apiRes.buffer;

            res.ContentType = apiRes.contentType;
            res.ContentLength64 = buffer.LongLength;
            res.StatusCode = apiRes.status;

            try {
                res.OutputStream.Write(buffer, 0, buffer.Length);
            } catch (HttpListenerException e) {
                Log($"HttpListenerException while writing response: {e.Message}", true, LogSeverity.Warning);
            } catch (IOException e) {
                Log($"IOException while writing response: {e.Message}", true, LogSeverity.Warning);
            } catch (ObjectDisposedException) {
            } finally {
                try { res.OutputStream.Close(); } catch { }
            }
        }

        internal static async void Stop() {
            RunServer = false;
            await WebSocketHandler.CloseAllWebSockets();
            listener?.Stop();
        }

        internal static APIResponse GetAPIResponse(HttpListenerRequest req) {
            string path = req.Url.AbsolutePath;
            if (path.StartsWith("/data/")) {
                APIResponse response = null;
                GameFiber.StartNew(() => {
                    response = new DataAPIResponse(req);
                });
                while (response == null) Thread.Yield();
                return response;
            } else if (path.StartsWith("/post/")) {
                APIResponse response = null;
                GameFiber.StartNew(() => {
                    response = new PostAPIResponse(req);
                });
                while (response == null) Thread.Yield();
                return response;
            } else if (path.StartsWith("/plugin/")) {
                return new PluginAPIResponse(req); 
            } else if (path.StartsWith("/page/")) {
                return new PageAPIResponse(req);
            } else if (path.StartsWith("/style/")) {
                return new StyleAPIResponse(req);
            } else if (path.StartsWith("/script/")) {
                return new ScriptAPIResponse(req);
            } else if (path.StartsWith("/image/")) {
                return new ImageAPIResponse(req);
            }
            return new APIResponse(req);
        }
    }
}