using System.IO;
using System.Linq;

namespace ExternalPoliceComputer.Utility {
    internal class DependencyCheck {
        private static bool IsFileAvailable(string fileName) {
            return File.Exists(fileName) || File.Exists(Path.Combine("plugins", "LSPDFR", fileName));
        }

        internal static bool IsCIAPIAvailable() {
            return IsFileAvailable("CalloutInterfaceAPI.dll");
        }

        internal static bool IsNewtonsoftJsonAvailable() {
            return IsFileAvailable("Newtonsoft.Json.dll");
        }

        internal static bool IsIPTCommonAvailable() {
            return IsFileAvailable("IPT.Common.dll");
        }

        internal static bool IsCDFAvailable() {
            return LSPD_First_Response.Mod.API.Functions.GetAllUserPlugins().Any(x => x.GetName().Name.Equals("CommonDataFramework"));
        }

        internal static bool IsCIAvailable() {
            return LSPD_First_Response.Mod.API.Functions.GetAllUserPlugins().Any(x => x.GetName().Name.Equals("CalloutInterface"));
        }

        internal static bool IsPRAvailable() {
            return LSPD_First_Response.Mod.API.Functions.GetAllUserPlugins().Any(x => x.GetName().Name.Equals("PolicingRedefined"));
        }
    }
}
