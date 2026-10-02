# Real knowledge-test format for each region. Admins can override these from the admin page.
# "verified": False means the official source did not publish exact numbers; check before going live.
# A section only counts if the questions in the bank carry the same "section" key.

DEFAULT_RULES = {
    # Canada
    "ca-ab": {"questions": 30, "pass_correct": 25, "time_limit": None, "sections": [], "verified": True,
              "note": "Alberta Class 7 knowledge test."},
    "ca-bc": {"questions": 50, "pass_correct": 40, "time_limit": 45, "sections": [], "verified": True,
              "note": "ICBC passenger vehicle knowledge test."},
    "ca-on": {"questions": 40, "pass_correct": 32, "time_limit": None, "verified": True,
              "sections": [
                  {"key": "signs", "name": "Road signs", "questions": 20, "pass_correct": 16},
                  {"key": "rules", "name": "Rules of the road", "questions": 20, "pass_correct": 16},
              ],
              "note": "G1 test. You must pass both parts."},
    "ca-qc": {"questions": 64, "pass_correct": 52, "time_limit": None, "sections": [], "verified": False,
              "note": "SAAQ theory exam, 80% to pass."},
    "ca-mb": {"questions": 25, "pass_correct": 20, "time_limit": None, "sections": [], "verified": False,
              "note": "MPI Class 5L knowledge test."},
    "ca-sk": {"questions": 25, "pass_correct": 20, "time_limit": None, "sections": [], "verified": False,
              "note": "SGI Class 7 knowledge test."},
    "ca-ns": {"questions": 40, "pass_correct": 32, "time_limit": None, "verified": True,
              "sections": [
                  {"key": "rules", "name": "Rules of the road", "questions": 20, "pass_correct": 16},
                  {"key": "signs", "name": "Road signs", "questions": 20, "pass_correct": 16},
              ],
              "note": "Class 7 knowledge exam. You must pass both parts."},
    # United States
    "us-ca": {"questions": 46, "pass_correct": 38, "time_limit": None, "sections": [], "verified": True,
              "note": "Under 18. Adults take 36 questions and need 30."},
    "us-tx": {"questions": 30, "pass_correct": 21, "time_limit": None, "sections": [], "verified": True,
              "note": "Texas DPS knowledge test."},
    "us-fl": {"questions": 50, "pass_correct": 40, "time_limit": 60, "sections": [], "verified": True,
              "note": "Class E knowledge exam."},
    "us-ny": {"questions": 20, "pass_correct": 14, "time_limit": None, "verified": True,
              "sections": [
                  {"key": "signs", "name": "Road signs", "questions": 4, "pass_correct": 2},
                  {"key": "rules", "name": "Rules of the road", "questions": 16, "pass_correct": 0},
              ],
              "note": "You also need at least 2 of the 4 road sign questions."},
    "us-wa": {"questions": 40, "pass_correct": 32, "time_limit": 45, "sections": [], "verified": True,
              "note": "Washington DOL knowledge test."},
    "us-il": {"questions": 35, "pass_correct": 28, "time_limit": None, "verified": True,
              "sections": [
                  {"key": "signs", "name": "Road signs", "questions": 15, "pass_correct": 12},
                  {"key": "rules", "name": "Rules of the road", "questions": 20, "pass_correct": 16},
              ],
              "note": "You must pass both parts."},
    # United Kingdom (multiple-choice part; the hazard perception part is separate)
    "gb-eng": {"questions": 50, "pass_correct": 43, "time_limit": 57, "sections": [], "verified": True,
               "note": "DVSA multiple-choice part. Hazard perception is a separate test."},
    "gb-sct": {"questions": 50, "pass_correct": 43, "time_limit": 57, "sections": [], "verified": True,
               "note": "DVSA multiple-choice part. Hazard perception is a separate test."},
    "gb-wls": {"questions": 50, "pass_correct": 43, "time_limit": 57, "sections": [], "verified": True,
               "note": "DVSA multiple-choice part. Hazard perception is a separate test."},
    "gb-nir": {"questions": 50, "pass_correct": 43, "time_limit": 57, "sections": [], "verified": False,
               "note": "DVA multiple-choice part. Hazard perception is a separate test."},
    # Australia
    "au-nsw": {"questions": 45, "pass_correct": 41, "time_limit": None, "verified": True,
               "sections": [
                   {"key": "general", "name": "General knowledge", "questions": 15, "pass_correct": 12},
                   {"key": "safety", "name": "Road safety", "questions": 30, "pass_correct": 29},
               ],
               "note": "Driver Knowledge Test (DKT). You must pass both parts."},
    "au-vic": {"questions": 32, "pass_correct": 25, "time_limit": None, "sections": [], "verified": False,
               "note": "Learner permit knowledge test."},
    "au-qld": {"questions": 30, "pass_correct": 27, "time_limit": None, "verified": False,
               "sections": [
                   {"key": "giveway", "name": "Give way", "questions": 10, "pass_correct": 9},
                   {"key": "rules", "name": "Road rules", "questions": 20, "pass_correct": 18},
               ],
               "note": "Road rules test. You must pass both parts."},
    "au-wa": {"questions": 30, "pass_correct": 24, "time_limit": None, "sections": [], "verified": True,
              "note": "Road rules theory test."},
    # Germany: the real test uses error points (max 10); this is a simple approximation
    "de-be": {"questions": 30, "pass_correct": 27, "time_limit": 45, "sections": [], "verified": False,
              "note": "Real test uses error points: max 10 points."},
    "de-by": {"questions": 30, "pass_correct": 27, "time_limit": 45, "sections": [], "verified": False,
              "note": "Real test uses error points: max 10 points."},
    "de-hh": {"questions": 30, "pass_correct": 27, "time_limit": 45, "sections": [], "verified": False,
              "note": "Real test uses error points: max 10 points."},
    "de-he": {"questions": 30, "pass_correct": 27, "time_limit": 45, "sections": [], "verified": False,
              "note": "Real test uses error points: max 10 points."},
    # United Arab Emirates
    "ae-du": {"questions": 35, "pass_correct": 28, "time_limit": None, "sections": [], "verified": False,
              "note": "RTA theory test."},
    "ae-az": {"questions": 35, "pass_correct": 28, "time_limit": None, "sections": [], "verified": False,
              "note": "Theory test."},
    "ae-sh": {"questions": 35, "pass_correct": 28, "time_limit": None, "sections": [], "verified": False,
              "note": "Theory test."},
}
