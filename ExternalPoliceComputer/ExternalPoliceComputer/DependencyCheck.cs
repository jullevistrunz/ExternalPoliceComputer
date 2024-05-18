using System.IO;
using System.Linq;

namespace ExternalPoliceComputer {
    internal class DependencyCheck { 
        internal static bool IsCIAPIAvailable() {
            return File.Exists("CalloutInterfaceAPI.dll");
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
