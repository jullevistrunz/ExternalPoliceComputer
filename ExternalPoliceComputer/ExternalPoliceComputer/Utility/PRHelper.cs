using ExternalPoliceComputer.Data;
using ExternalPoliceComputer.Setup;
using PolicingRedefined.Interaction.Assets.PedAttributes;
using Rage;
using System.Linq;


namespace ExternalPoliceComputer.Utility {
    internal class PRHelper {
        internal static void GiveCitation(CourtData courtData) {
            EPCPedData pedData = DataController.PedDatabase.FirstOrDefault(x => x.Name == courtData.PedName);
            if (pedData == null) return;
            Ped ped = pedData.Holder;
            if (ped == null || !ped.IsValid()) return;
            foreach (CourtData.Charge charge in courtData.Charges) {
                bool isArrestable = charge.IsArrestable ?? false;
                Citation citation = new Citation(ped, charge.Name, charge.Fine, SetupController.GetLanguage().units.currencySymbol, SetupController.GetConfig().displayCurrencySymbolBeforeNumber, isArrestable);
                PolicingRedefined.API.PedAPI.GiveCitationToPed(ped, citation);
            }
        }
    }
}
