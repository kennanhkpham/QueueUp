import streamlit as st

def initialize_queue():
    """Initializes session state keys if they don't exist."""
    if "queue" not in st.session_state:
        st.session_state.queue = []
    if "current_match" not in st.session_state:
        st.session_state.current_match = []
    if "courts" not in st.session_state:
        st.session_state.courts = {}

def add_player(name, skill, count=1):
    """Adds a single registration entry (with group size count) to the queue."""
    player_data = {
        "name": name,
        "skill": skill,
        "count": count
    }
    st.session_state.queue.append(player_data)

def clear_queue():
    """Resets both the queue and all court matches."""
    st.session_state.queue = []
    st.session_state.current_match = []
    for court_num in st.session_state.courts:
        st.session_state.courts[court_num] = []

def update_courts_count(num_courts):
    """Ensures court dictionary matches the specified number of active courts."""
    for i in range(1, num_courts + 1):
        if i not in st.session_state.courts:
            st.session_state.courts[i] = []
            
    existing_courts = list(st.session_state.courts.keys())
    for i in existing_courts:
        if i > num_courts:
            st.session_state.queue = st.session_state.courts[i] + st.session_state.queue
            del st.session_state.courts[i]

def find_match_for_skill(skill_level):
    """
    Finds a combination of entries (4, 3+1, 2+2, 2+1+1, 1+1+1+1) 
    that sums to exactly 4 players for a specific skill level.
    """
    candidates = [e for e in st.session_state.queue if e["skill"] == skill_level]
    
    # 1. Direct match: Group of 4
    g4 = next((e for e in candidates if e["count"] == 4), None)
    if g4:
        return [g4]

    # 2. Group of 3 + Solo (1)
    g3 = next((e for e in candidates if e["count"] == 3), None)
    g1 = next((e for e in candidates if e["count"] == 1), None)
    if g3 and g1:
        return [g3, g1]

    # 3. Two Groups of 2 OR Group of 2 + Two Solos
    g2_list = [e for e in candidates if e["count"] == 2]
    g1_list = [e for e in candidates if e["count"] == 1]
    
    if len(g2_list) >= 2:
        return g2_list[:2]
    if len(g2_list) >= 1 and len(g1_list) >= 2:
        return [g2_list[0]] + g1_list[:2]

    # 4. Four Solos
    if len(g1_list) >= 4:
        return g1_list[:4]

    return None

def assign_next_group_to_court(court_num):
    """
    Assigns a full group of 4 players to a court by prioritizing skill levels
    and pairing solos (1) with groups of 3 or 2.
    """
    if not st.session_state.queue:
        return

    # Scan skill categories in priority order
    for skill in ["Beginner", "Intermediate", "Advanced"]:
        matched_groups = find_match_for_skill(skill)
        if matched_groups:
            # Remove matched players from queue
            for entry in matched_groups:
                st.session_state.queue.remove(entry)
            
            st.session_state.courts[court_num] = matched_groups
            break

def finish_court_match(court_num):
    """Clears players from finished court and automatically fills it if a match is ready."""
    st.session_state.courts[court_num] = []
    assign_next_group_to_court(court_num)