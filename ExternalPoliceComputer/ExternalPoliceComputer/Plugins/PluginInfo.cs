using System.Collections.Generic;

namespace ExternalPoliceComputer.Plugins {
    public class PluginInfo {
        public string name;
        public string description;
        public string version;
        public string author;

        public string id;
        public List<string> pages = new List<string>();
        public List<string> scripts = new List<string>();
        public List<string> styles = new List<string>();
    }
}
