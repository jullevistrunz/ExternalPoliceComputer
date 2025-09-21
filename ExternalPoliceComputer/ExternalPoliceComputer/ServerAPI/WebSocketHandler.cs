using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Setup;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using static ExternalPoliceComputer.Utility.Helper;

namespace ExternalPoliceComputer.ServerAPI {
    internal class WebSocketHandler {
        private static readonly List<WebSocket> WebSockets = new List<WebSocket>();
        private static readonly object WebSocketLock = new Object();
        private static readonly Dictionary<WebSocket, CancellationTokenSource> IntervalTokens = new Dictionary<WebSocket, CancellationTokenSource>();

        internal static async void HandleWebSocket(HttpListenerContext ctx) {
            try {
                HttpListenerWebSocketContext wsContext = await ctx.AcceptWebSocketAsync(null);
                WebSocket webSocket = wsContext.WebSocket;
                byte[] buffer = new byte[1024];

                lock (WebSocketLock) {
                    WebSockets.Add(webSocket);
                }

                Log($"New WebSocket #{WebSockets.IndexOf(webSocket)}", true, LogSeverity.Info);

                while (webSocket.State == WebSocketState.Open && Server.RunServer) {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Close) {
                        lock (WebSocketLock) {
                            WebSockets.Remove(webSocket);
                            if (IntervalTokens.TryGetValue(webSocket, out var cts)) {
                                cts.Cancel();
                                IntervalTokens.Remove(webSocket);
                            }
                        }
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                        break;
                    }

                    string clientMsg = Encoding.UTF8.GetString(buffer, 0, result.Count).Trim();

                    if (clientMsg.StartsWith("interval/")) {
                        string intervalMsg = clientMsg.Substring("interval/".Length);
                        CancellationTokenSource cts = new CancellationTokenSource();
                        lock (WebSocketLock) {
                            IntervalTokens[webSocket] = cts;
                        }
                        await SendUpdatesOnInterval(webSocket, clientMsg.Substring("interval/".Length), cts.Token);
                    } else {
                        switch (clientMsg) {
                            case "ping":
                                await SendData(webSocket, "\"Pong!\"", clientMsg);
                                break;
                            case "shiftHistoryUpdated":
                                DataController.ShiftHistoryUpdated += OnShiftHistoryUpdated;

                                void OnShiftHistoryUpdated() {
                                    if (webSocket.State != WebSocketState.Open || !Server.RunServer) return;
                                    SendData(webSocket, "\"Shift history updated\"", "shiftHistoryUpdated").Wait();
                                }
                                break;
                            default:
                                await SendData(webSocket, $"\"Unknown command: '{clientMsg}'\"", clientMsg);
                                break;
                        }
                    }
                }
            } catch (Exception e) {
                if (Server.RunServer) Log($"WebSocket Error: {e.Message}", true, LogSeverity.Error);
            } 
        }

        private static Task SendUpdatesOnInterval(WebSocket webSocket, string clientMsg, CancellationToken token) {
            return Task.Run(async () => {
                try {
                    while (webSocket.State == WebSocketState.Open && Server.RunServer && !token.IsCancellationRequested) {
                        string lastResponseMsg = "";
                        string responseMsg;
                        switch (clientMsg) {
                            case "playerLocation":
                                responseMsg = JsonConvert.SerializeObject(DataController.PlayerLocation);

                                if (responseMsg != lastResponseMsg) {
                                    lastResponseMsg = responseMsg;
                                    await SendData(webSocket, responseMsg, clientMsg, token);
                                }
                                break;
                            case "time":
                                responseMsg = $"\"{DataController.CurrentTime}\"";

                                if (responseMsg != lastResponseMsg) {
                                    lastResponseMsg = responseMsg;
                                    await SendData(webSocket, responseMsg, clientMsg, token);
                                }
                                break;
                            default:
                                await SendData(webSocket, $"\"Unknown interval command: '{clientMsg}'\"", clientMsg, token);
                                return;
                        }

                        await Task.Delay(SetupController.GetConfig().webSocketUpdateInterval, token);
                    }
                } catch (OperationCanceledException) {
                } catch (WebSocketException wse) when (wse.InnerException?.Message.Contains("nonexistent network connection") ?? false) {
                    Log("WebSocket lost", true, LogSeverity.Warning);
                } catch (Exception e) {
                    string innerMessage = e.InnerException != null ? $"Inner: {e.InnerException.Message}" : "";
                    Log($"WebSocket Error on interval: {e.Message}{innerMessage}", true, LogSeverity.Error);
                }
            });
        }

        private static async Task SendData(WebSocket webSocket, string data, string clientMsg, CancellationToken token = default) {
            string responseMsg = $"{{ \"response\": {data}, \"request\": \"{clientMsg}\" }}";

            await webSocket.SendAsync(
                new ArraySegment<byte>(Encoding.UTF8.GetBytes(responseMsg)),
                WebSocketMessageType.Text,
                true,
                token
            );
        }

        internal static async Task CloseAllWebSockets() {
            WebSocket[] webSocketsArr;
            lock (WebSocketLock) {
                foreach (var cts in IntervalTokens.Values) {
                    cts.Cancel();
                }
                IntervalTokens.Clear();

                webSocketsArr = WebSockets.ToArray();
                WebSockets.Clear();
            }

            foreach (WebSocket webSocket in webSocketsArr) {
                try {
                    if (webSocket.State == WebSocketState.Open || webSocket.State == WebSocketState.CloseReceived) {
                        Log($"Closing WebSocket #{Array.IndexOf(webSocketsArr, webSocket)}", true, LogSeverity.Info);
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                    }
                } catch (Exception e) {
                    Log($"WebSocket close error: {e.Message}", true, LogSeverity.Warning);
                }
            }
        }
    }
}
