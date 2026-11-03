"""Curated places of Bangladesh (nature + heritage). Hand-written so the data is clean and licence-free.

Coordinates are approximate points of interest (good for a map pin, not for surveying) and descriptions are
short original summaries. There is no free API for "best rated" (Google/TripAdvisor ratings are not free), so:
  * `must_visit` = curator pick,   * `unesco` = UNESCO World Heritage,   * users add their own 1-5 star rating.
Edit/extend this list freely; tests check the schema and that every pin is inside Bangladesh.
"""
from __future__ import annotations

from dataclasses import dataclass

CATEGORIES = ("beach", "island", "hill", "forest", "nature", "historical", "religious", "museum", "landmark")
DIVISIONS = ("Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh")
HISTORY_CATEGORIES = {"historical", "religious", "museum", "landmark"}


@dataclass(frozen=True)
class PlaceInfo:
    id: str
    name: str
    name_bn: str
    category: str
    division: str
    district: str
    lat: float
    lon: float
    description: str
    best_season: str = ""
    unesco: bool = False
    must_visit: bool = False
    sea_point: tuple[float, float] | None = None
    flood: bool = False
    tips_page: str = ""


def _p(*a, **k) -> PlaceInfo:
    return PlaceInfo(*a, **k)


_LIST: list[PlaceInfo] = [
    # ---- nature (these 8 also exist in destinations.py so they keep their tuned weather settings) ----
    _p("coxs_bazar", "Cox's Bazar", "কক্সবাজার", "beach", "Chattogram", "Cox's Bazar", 21.4272, 92.0058,
       "A very long, mostly unbroken sandy sea beach; Bangladesh's best-known seaside destination.",
       "Nov-Feb", must_visit=True, tips_page="Cox's Bazar"),
    _p("saint_martin", "Saint Martin's Island", "সেন্ট মার্টিন", "island", "Chattogram", "Cox's Bazar", 20.6276, 92.3225,
       "Small coral island in the Bay of Bengal, reached by boat from Teknaf; clear water and quiet beaches.",
       "Nov-Feb", must_visit=True, tips_page="Saint Martin's Island"),
    _p("kuakata", "Kuakata", "কুয়াকাটা", "beach", "Barishal", "Patuakhali", 21.8167, 90.1167,
       "Wide sea beach where you can watch both sunrise and sunset over the water.", "Nov-Feb", tips_page="Kuakata"),
    _p("sundarbans", "Sundarbans (Karamjal)", "সুন্দরবন", "forest", "Khulna", "Bagerhat", 22.27, 89.62,
       "The world's largest mangrove forest and a UNESCO site, home to the Bengal tiger; explored by boat.",
       "Nov-Feb", unesco=True, must_visit=True, flood=True, tips_page="Sundarbans"),
    _p("ratargul", "Ratargul Swamp Forest", "রাতারগুল", "forest", "Sylhet", "Sylhet", 25.01, 91.93,
       "A freshwater swamp forest that you tour by small boat; most atmospheric in the monsoon.",
       "Jul-Sep (flooded forest), Nov-Feb (easier access)", flood=True, tips_page="Ratargul Swamp Forest"),
    _p("sajek", "Sajek Valley", "সাজেক", "hill", "Chattogram", "Rangamati", 23.3811, 92.2936,
       "Hill-top valley above the clouds in the Chittagong Hill Tracts, known for sunrise and sea-of-cloud views.",
       "Oct-Feb", must_visit=True, tips_page="Sajek Valley"),
    _p("bandarban", "Bandarban", "বান্দরবান", "hill", "Chattogram", "Bandarban", 22.1953, 92.2184,
       "Hill district with waterfalls, trekking routes and indigenous communities.", "Nov-Feb", flood=True,
       tips_page="Bandarban"),
    _p("srimangal", "Sreemangal", "শ্রীমঙ্গল", "nature", "Sylhet", "Moulvibazar", 24.3065, 91.7296,
       "The tea capital of Bangladesh: rolling tea gardens, forests and lakes.", "Oct-Mar", tips_page="Sreemangal"),
    _p("lawachara", "Lawachara National Park", "লাউয়াছড়া জাতীয় উদ্যান", "forest", "Sylhet", "Moulvibazar", 24.3236, 91.7845,
       "Protected rainforest near Sreemangal, known for hoolock gibbons and birdlife.", "Nov-Mar", tips_page="Sreemangal"),
    _p("jaflong", "Jaflong", "জাফলং", "nature", "Sylhet", "Sylhet", 25.1636, 92.0187,
       "Stony riverbed on the Meghalaya border with views of the Khasi hills.", "Oct-Mar", flood=True, tips_page="Sylhet"),
    _p("tanguar_haor", "Tanguar Haor", "টাঙ্গুয়ার হাওর", "nature", "Sylhet", "Sunamganj", 25.13, 91.05,
       "A large freshwater wetland and Ramsar site, famous for migratory birds and houseboat trips.",
       "Jul-Oct (water), Dec-Feb (birds)", flood=True, tips_page="Sunamganj"),
    _p("inani", "Inani Beach", "ইনানী সৈকত", "beach", "Chattogram", "Cox's Bazar", 21.2096, 92.0414,
       "Quieter stretch of the Cox's Bazar-Teknaf coast with rocks and coral stones.", "Nov-Feb",
       sea_point=(21.20, 91.97), tips_page="Cox's Bazar"),
    _p("patenga", "Patenga Sea Beach", "পতেঙ্গা সৈকত", "beach", "Chattogram", "Chattogram", 22.2368, 91.7842,
       "Chattogram's city beach near the mouth of the Karnaphuli river; busy on weekends.", "Nov-Feb",
       sea_point=(22.20, 91.78), tips_page="Chittagong"),
    _p("hiron_point", "Hiron Point (Nilkamal)", "হিরণ পয়েন্ট", "forest", "Khulna", "Bagerhat", 21.8333, 89.4667,
       "Southern Sundarbans wildlife-viewing area reached by launch from Mongla.", "Nov-Feb",
       sea_point=(21.70, 89.45), flood=True, tips_page="Sundarbans"),
    _p("rangamati", "Rangamati & Kaptai Lake", "রাঙ্গামাটি", "nature", "Chattogram", "Rangamati", 22.6565, 92.173,
       "Lake town in the hills; boat trips on Kaptai Lake, hanging bridge and local crafts.", "Oct-Mar",
       tips_page="Rangamati"),
    _p("alutila", "Alutila Cave", "আলুটিলা গুহা", "nature", "Chattogram", "Khagrachhari", 23.1, 91.98,
       "Natural cave in the hills of Khagrachhari, walked through with a local guide.", "Nov-Feb",
       tips_page="Khagrachhari"),
    # ---- heritage: Dhaka ----
    _p("lalbagh_fort", "Lalbagh Fort", "লালবাগ কেল্লা", "historical", "Dhaka", "Dhaka", 23.7188, 90.3883,
       "Unfinished 17th-century Mughal fort complex in old Dhaka with a mosque, a tomb and gardens.", "Nov-Feb",
       must_visit=True, tips_page="Dhaka"),
    _p("ahsan_manzil", "Ahsan Manzil", "আহসান মঞ্জিল", "historical", "Dhaka", "Dhaka", 23.7086, 90.4064,
       "The pink riverside palace of the Nawabs of Dhaka on the Buriganga, now a museum.", "Nov-Feb",
       must_visit=True, tips_page="Dhaka"),
    _p("star_mosque", "Star Mosque (Tara Masjid)", "তারা মসজিদ", "religious", "Dhaka", "Dhaka", 23.7123, 90.4087,
       "Old Dhaka mosque decorated with mosaics of stars in china-tile.", "Nov-Feb", tips_page="Dhaka"),
    _p("dhakeshwari", "Dhakeshwari Temple", "ঢাকেশ্বরী জাতীয় মন্দির", "religious", "Dhaka", "Dhaka", 23.7236, 90.388,
       "Bangladesh's national Hindu temple, central to Durga Puja celebrations.", "Sep-Oct (Durga Puja)", tips_page="Dhaka"),
    _p("national_museum", "Bangladesh National Museum", "জাতীয় জাদুঘর", "museum", "Dhaka", "Dhaka", 23.7378, 90.3955,
       "The country's largest museum at Shahbag, covering art, history and natural history.", "Any (indoors)",
       tips_page="Dhaka"),
    _p("liberation_museum", "Liberation War Museum", "মুক্তিযুদ্ধ জাদুঘর", "museum", "Dhaka", "Dhaka", 23.7777, 90.3739,
       "Museum documenting the 1971 Liberation War through photographs, objects and testimonies.", "Any (indoors)",
       must_visit=True, tips_page="Dhaka"),
    _p("parliament_house", "National Parliament House", "জাতীয় সংসদ ভবন", "landmark", "Dhaka", "Dhaka", 23.7625, 90.3784,
       "Landmark of modern architecture designed by Louis Kahn; check access rules before visiting.", "Nov-Feb",
       tips_page="Dhaka"),
    _p("martyrs_memorial", "National Martyrs' Memorial", "জাতীয় স্মৃতিসৌধ", "landmark", "Dhaka", "Dhaka", 23.9136, 90.2542,
       "Monument at Savar honouring those who died in the 1971 war.", "Nov-Feb", tips_page="Dhaka"),
    _p("sonargaon", "Sonargaon (Panam Nagar)", "সোনারগাঁও", "historical", "Dhaka", "Narayanganj", 23.6525, 90.5995,
       "Medieval capital region of Bengal; Panam Nagar is a street of 19th-century merchant houses.", "Nov-Feb",
       tips_page="Sonargaon"),
    # ---- heritage: rest of the country ----
    _p("sixty_dome_mosque", "Sixty Dome Mosque", "ষাট গম্বুজ মসজিদ", "historical", "Khulna", "Bagerhat", 22.6741, 89.7422,
       "15th-century brick mosque in the historic mosque city of Bagerhat (UNESCO).", "Nov-Feb", unesco=True,
       must_visit=True, tips_page="Bagerhat"),
    _p("paharpur", "Paharpur Buddhist Vihara", "পাহাড়পুর বৌদ্ধ বিহার", "historical", "Rajshahi", "Naogaon", 25.0312, 88.9764,
       "Ruins of the Somapura Mahavihara, a large 8th-century Buddhist monastery (UNESCO).", "Nov-Feb", unesco=True,
       must_visit=True, tips_page="Naogaon"),
    _p("mahasthangarh", "Mahasthangarh", "মহাস্থানগড়", "historical", "Rajshahi", "Bogura", 24.9524, 89.3433,
       "Ruins of the ancient city of Pundranagara, one of the earliest urban sites in Bangladesh.", "Nov-Feb",
       tips_page="Bogra"),
    _p("kantajew", "Kantajew Temple", "কান্তজিউ মন্দির", "religious", "Rangpur", "Dinajpur", 25.80, 88.665,
       "18th-century terracotta-decorated Hindu temple near Dinajpur.", "Nov-Feb", must_visit=True,
       tips_page="Dinajpur"),
    _p("puthia", "Puthia Temple Complex", "পুঠিয়া মন্দির কমপ্লেক্স", "historical", "Rajshahi", "Rajshahi", 24.3636, 88.8383,
       "Cluster of Hindu temples and a palace from the zamindar era near Rajshahi.", "Nov-Feb", tips_page="Rajshahi"),
    _p("natore_rajbari", "Natore Rajbari", "নাটোর রাজবাড়ী", "historical", "Rajshahi", "Natore", 24.4146, 88.9776,
       "Former palace of the Natore zamindar family, surrounded by gardens.", "Nov-Feb", tips_page="Natore"),
    _p("mainamati", "Mainamati & Shalban Vihara", "ময়নামতি শালবন বিহার", "historical", "Chattogram", "Cumilla", 23.4326, 91.1394,
       "Buddhist monastery ruins on the Mainamati-Lalmai ridge near Cumilla.", "Nov-Feb", tips_page="Comilla"),
    _p("shah_jalal_dargah", "Shah Jalal Dargah", "শাহজালাল মাজার", "religious", "Sylhet", "Sylhet", 24.8991, 91.8693,
       "Major Sufi shrine in Sylhet city, visited by pilgrims all year.", "Any", must_visit=True, tips_page="Sylhet"),
    _p("shashi_lodge", "Shashi Lodge", "শশী লজ", "historical", "Mymensingh", "Mymensingh", 24.7539, 90.4073,
       "Early 20th-century mansion built by a local zamindar family in Mymensingh town.", "Nov-Feb",
       tips_page="Mymensingh"),
]

PLACES: dict[str, PlaceInfo] = {p.id: p for p in _LIST}


def as_destination(p: PlaceInfo):
    """Adapt a place to the weather pipeline's Destination (registry entries keep their tuned settings)."""
    from .destinations import DESTINATIONS, Destination
    if p.id in DESTINATIONS:
        return DESTINATIONS[p.id]
    return Destination(p.id, p.name, p.name_bn, p.lat, p.lon, p.tips_page or p.district, (p.name.lower(),),
                       sea_point=p.sea_point, flood=p.flood)
