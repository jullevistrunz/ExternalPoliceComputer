using CommonDataFramework.Modules.PedDatabase;
using Rage;
using System.Collections.Generic;
using static ExternalPoliceComputer.Utility.CitationArrestHelper;
using static ExternalPoliceComputer.Setup.SetupController;
using ExternalPoliceComputer.Setup;

namespace ExternalPoliceComputer.Data {
    public class EPCPedData {
        internal readonly PedData CDFPedData;
        internal readonly Ped Holder;

        public string Name;
        public string FirstName;
        public string LastName;
        public string Birthday;
        public string Gender;
        public string Address;
        public bool IsInGang;
        public string AdvisoryText;
        public int TimesStopped;
        public bool IsWanted;
        public string WarrantText;
        public bool IsOnProbation;
        public bool IsOnParole;
        public string LicenseStatus;
        public string LicenseExpiration;
        public string WeaponPermitStatus;
        public string WeaponPermitExpiration;
        public string WeaponPermitType;
        public string FishingPermitStatus;
        public string FishingPermitExpiration;
        public string HuntingPermitStatus;
        public string HuntingPermitExpiration;
        public List<CitationGroup.Charge> Citations;
        public List<ArrestGroup.Charge> Arrests;

        internal EPCPedData(Ped ped) {
            CDFPedData = ped.GetPedData();
            Holder = ped;
            PopulateParameters();
        }
        internal EPCPedData(PedData pedData) {
            CDFPedData = pedData;
            Holder = pedData.Holder;
            PopulateParameters();
        }
        public EPCPedData() { }

        private void PopulateParameters() {
            if (CDFPedData == null) return;

            Name = CDFPedData.FullName;
            FirstName = CDFPedData.Firstname;
            LastName = CDFPedData.Lastname;
            Birthday = CDFPedData.Birthday.ToString("s");
            Gender = CDFPedData.Gender.ToString();
            IsWanted = CDFPedData.Wanted;
            IsOnProbation = CDFPedData.IsOnProbation;
            IsOnParole = CDFPedData.IsOnParole;
            Address = $"{CDFPedData.Address}, {CDFPedData.Address.Zone.RealAreaName}";
            LicenseStatus = CDFPedData.DriversLicenseState.ToString();
            LicenseExpiration = CDFPedData.DriversLicenseExpiration?.ToString("s");
            WeaponPermitStatus = CDFPedData.WeaponPermit.Status.ToString();
            WeaponPermitExpiration = CDFPedData.WeaponPermit.ExpirationDate?.ToString("s");
            WeaponPermitType = CDFPedData.WeaponPermit.PermitType.ToString();
            FishingPermitStatus = CDFPedData.FishingPermit.Status.ToString();
            FishingPermitExpiration = CDFPedData.FishingPermit.ExpirationDate?.ToString("s");
            HuntingPermitStatus = CDFPedData.HuntingPermit.Status.ToString();
            HuntingPermitExpiration = CDFPedData.HuntingPermit.ExpirationDate?.ToString("s");
            if (CDFPedData.HasRealPed && Holder.IsValid()) {
                IsInGang = Holder.RelationshipGroup.Name.ToLower().Contains("gang");
            }
            AdvisoryText = CDFPedData.AdvisoryText;
            WarrantText = IsWanted ? GetRandomWarrantCharge().name : null;

            Citations = SelectWithProbability(GetConfig().hasPriorCitationsProbability)
                ? GetRandomCitationCharges(GetConfig().maxNumberOfPriorCitations)
                : new List<CitationGroup.Charge>();

            if (IsWanted) {
                Arrests = SelectWithProbability(GetConfig().hasPriorArrestsWithWarrantProbability)
                    ? GetRandomArrestCharges(GetConfig().maxNumberOfPriorArrestsWithWarrant)
                    : new List<ArrestGroup.Charge>();
            } else {
                Arrests = SelectWithProbability(GetConfig().hasPriorArrestsProbability)
                    ? GetRandomArrestCharges(GetConfig().maxNumberOfPriorArrests)
                    : new List<ArrestGroup.Charge>();
            }

            if (Citations.Count > 0 || Arrests.Count > 0) {
                CDFPedData.TimesStopped += Citations.Count / 2 + Arrests.Count / 2;
            }

            TimesStopped = CDFPedData.TimesStopped;
        }
    }
}
