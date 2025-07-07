// Ignore Spelling: Taskbar Newtonsoft Ffl Ccw Yankton Cayo Perico

namespace ExternalPoliceComputer.Setup {
    internal class Language {
        public InGame inGame = new InGame();
        public Index index = new Index();
        public PedSearch pedSearch = new PedSearch();
        public VehicleSearch vehicleSearch = new VehicleSearch();
        public Values values = new Values();
        public Reports reports = new Reports();
        public Units units = new Units();

        public class InGame {
            public string loaded = "ExternalPoliceComputer has been loaded.";
            public string errorMissingCIAPI = "ExternalPoliceComputer failed to load. Couldn't find CalloutInterfaceAPI.";
            public string errorMissingCDF = "ExternalPoliceComputer failed to load. Couldn't find CommonDataFramework.";
            public string unloaded = "ExternalPoliceComputer has been unloaded.";
            public string errorCDFLoadingAborted = "ExternalPoliceComputer failed to load. CommonDataFramework didn't load (blame Marcel).";
        }

        public class Index {
            public Static @static = new Static();
            public Settings settings = new Settings();
            public Notifications notifications = new Notifications();

            public class Static {
                public string title = "ExternalPoliceComputer";
                public Desktop desktop = new Desktop();
                public Taskbar taskbar = new Taskbar();
                public Settings settings = new Settings();

                public class Desktop {
                    public string pedSearch = "Ped Lookup";
                    public string vehicleSearch = "Vehicle Lookup";
                    public string reports = "Reports";
                }

                public class Taskbar {
                    public string settings = "Control Panel";
                }

                public class Settings {
                    public OfficerInformation officerInformation = new OfficerInformation();
                    public CurrentShift currentShift = new CurrentShift();

                    public class OfficerInformation {
                        public string title = "Officer Information";
                        public string firstName = "First Name";
                        public string lastName = "Last Name";
                        public string rank = "Rank";
                        public string callSign = "Call Sign";
                        public string agency = "Agency";
                        public string badgeNumber = "Badge Number";
                        public string autoFill = "Auto Fill";
                        public string save = "Save";
                    }

                    public class CurrentShift {
                        public string startShift = "Start Shift";
                        public string endShift = "End Shift";
                    }
                }
            }

            public class Settings {
                public string version = "Version";
                public CurrentShift currentShift = new CurrentShift();

                public class CurrentShift {
                    public string startTime = "Start Time";
                    public string duration = "Duration";
                    public string offDuty = "You are currently off duty.";
                }
            }

            public class Notifications {
                public string webSocketOnClose = "A WebSocket lost connection. Please reload the page.";
                public string officerInformationSaved = "Successfully saved officer information data.";
                public string officerInformationError = "An error occurred while trying to save officer information data.";
                public string currentShiftStartedOfficerInformationExists = "You are now on duty as";
                public string currentShiftStarted = "You are now on duty.";
                public string currentShiftStartedError = "An error occurred while trying to start your shift.";
                public string currentShiftEnded = "You are now off duty.";
                public string currentShiftEndedError = "An error occurred while trying to end your shift.";
            }
        }

        public class PedSearch { 
            public Static @static = new Static();
            public Notifications notifications = new Notifications();

            public class Static {
                public string title = "Ped Lookup";
                public string search = "Search Ped";
                public string searchInput = "Search ped by name";
                public string basicInfoTitle = "Basic Information";
                public string legalInfoTitle = "Legal Information";
                public string licensesTitle = "Licenses & Permits";
                public string historyTitle = "History";
                public Labels labels = new Labels();

                public class Labels {
                    public string firstName = "First Name";
                    public string lastName = "Last Name";
                    public string gender = "Gender";
                    public string birthday = "Date Of Birth";
                    public string age = "Age";
                    public string address = "Address";
                    public string gangAffiliation = "Gang Affiliation";
                    public string advisory = "Advisory";
                    public string wantedStatus = "Warrant Status";
                    public string timesStopped = "Times Stopped";
                    public string probationStatus = "Probation Status";
                    public string paroleStatus = "Parole Status";
                    public string licenseStatus = "Driving License Status";
                    public string licenseExpiration = "Driving License Expiration";
                    public string weaponPermitStatus = "Weapon Permit Status";
                    public string weaponPermitExpiration = "Weapon Permit Expiration";
                    public string fishingPermitStatus = "Fishing Permit Status";
                    public string fishingPermitExpiration = "Fishing Permit Expiration";
                    public string huntingPermitStatus = "Hunting Permit Status";
                    public string huntingPermitExpiration = "Hunting Permit Expiration";
                    public string citations = "Citations";
                    public string arrests = "Arrests";
                }
            }

            public class Notifications { 
                public string emptySearchInput = "Please enter a ped's name.";
                public string pedNotFound = "Couldn't find a ped with that name.";
            }
        }

        public class VehicleSearch {
            public Static @static = new Static();
            public Notifications notifications = new Notifications();

            public class Static {
                public string title = "Vehicle Lookup";
                public string search = "Search Vehicle";
                public string searchInput = "Search vehicle by license plate or VIN";
                public string basicInfoTitle = "Basic Information";
                public string documentsTitle = "Documents";
                public Labels labels = new Labels();

                public class Labels {
                    public string licensePlate = "License Plate";
                    public string owner = "Owner";
                    public string isStolen = "Stolen";
                    public string color = "Color";
                    public string vehicleModel = "Vehicle Model";
                    public string registrationStatus = "Registration Status";
                    public string registrationExpiration = "Registration Expiration";
                    public string insuranceStatus = "Insurance Status";
                    public string insuranceExpiration = "Insurance Expiration";
                }
            }

            public class Notifications {
                public string emptySearchInput = "Please enter a vehicle's license plate or VIN.";
                public string vehicleNotFound = "Couldn't find a vehicle with that license plate or VIN.";
            }
        }

        public class Values {
            public string wanted = "Wanted for";
            public string notWanted = "Not wanted";
            public string @true = "Yes";
            public string @false = "No";
            public string empty = "N/A";
            public string Valid = "Valid";
            public string Expired = "Expired";
            public string Revoked = "Revoked";
            public string Suspended = "Suspended";
            public string Unlicensed = "Unlicensed";
            public string None = "None";
            public string CcwPermit = "Carrying a concealed weapon (CCW)";
            public string FflPermit = "Federal firearms license (FFL)";
            public string Government = "Government";
            public string LosSantos = "Los Santos";
            public string LosSantosCounty = "Los Santos County";
            public string BlaineCounty = "Blaine County";
            public string SanAndreas = "San Andreas";
            public string NorthYankton = "North Yankton";
            public string CayoPerico = "Cayo Perico";
        }

        public class Reports {
            public string newReportTitle = "New Report";
            public string[] statusMap = {
                "Closed",
                "Open",
                "Canceled"
            };
            public Static @static = new Static();
            public Notifications notifications = new Notifications();
            public Sections sections = new Sections();
            public IdTypeMap idTypeMap = new IdTypeMap();
            public List list = new List();

            public class Static {
                public string title = "Reports";
                public ListPage listPage = new ListPage();
                public CreatePage createPage = new CreatePage();

                public class ListPage {
                    public string createButton = "Create New Reports";
                    public ReportType reportType = new ReportType();

                    public class ReportType {
                        public string incident = "Incident Reports";
                        public string citation = "Citation Reports";
                        public string arrest = "Arrest Reports";
                    }
                }

                public class CreatePage {
                    public string saveButton = "Save Report";
                    public ReportType reportType = new ReportType();

                    public class ReportType {
                        public string select = "Select Report Type";
                        public string incident = "Incident Report";
                        public string citation = "Citation Report";
                        public string arrest = "Arrest Report";
                    }
                }
            }

            public class Notifications {
                public string createPageAlreadyOpen = "Only one report can be created at a time.";
                public string invalidPedName = "A ped with this name doesn't exist.";
                public string invalidVehicleLicensePlate = "A vehicle with this license plate doesn't exist.";
                public string saveSuccess = "Report saved successfully.";
                public string saveError = "An error occurred while trying to save the report.";
            }

            public class Sections {
                public string notes = "Notes";
                public string fine = "Fine";
                public string incarceration = "Incarceration";
                public GeneralInformation generalInformation = new GeneralInformation();
                public Location location = new Location();
                public OfficerInformation officerInformation = new OfficerInformation();
                public Incident incident = new Incident();
                public Offender offender = new Offender();
                public Citation citation = new Citation();
                public Arrest arrest = new Arrest();

                public class GeneralInformation {
                    public string title = "General Information";
                    public string date = "Date";
                    public string time = "Time";
                    public string reportId = "Report ID";
                    public string status = "Status";
                }

                public class Location {
                    public string title = "Location";
                    public string area = "Area";
                    public string street = "Street";
                    public string county = "County";
                    public string postal = "Postal Code";
                }

                public class OfficerInformation {
                    public string title = "Officer Information";
                    public string firstName = "First Name";
                    public string lastName = "Last Name";
                    public string rank = "Rank";
                    public string callSign = "Call Sign";
                    public string agency = "Agency";
                    public string badgeNumber = "Badge Number";
                }

                public class Incident {
                    public string titleOffenders = "Offenders";
                    public string titleWitnesses = "Witnesses & Victims";
                    public string labelOffenders = "Full Name Of Offender";
                    public string labelWitnesses = "Full Name Of Witness";
                    public string addOffender = "Add Offender";
                    public string addWitness = "Add Witness";
                    public string removeOffender = "Remove Offender";
                    public string removeWitness = "Remove Witness";
                }

                public class Offender {
                    public string title = "Offender Information";
                    public string pedName = "Offender's Full Name";
                    public string vehicleLicensePlate = "License Plate Of Offender's Vehicle";
                }

                public class Citation {
                    public string title = "Citation Charges";
                    public string searchChargesPlaceholder = "Search citations";
                }

                public class Arrest {
                    public string title = "Arrest Charges";
                    public string searchChargesPlaceholder = "Search charges";
                }
            }

            public class IdTypeMap {
                public string incident = "I";
                public string citation = "C";
                public string arrest = "A";
            }

            public class List {
                public string viewButton = "View";
                public string editButton = "Edit";
            }
        }

        public class Units {
            public string year = "y";
            public string month = "mo";
            public string day = "d";
            public string hour = "h";
            public string minute = "m";
            public string second = "s";
            public string currencySymbol = "$";
            public string life = "Life";
        }
    }
}
