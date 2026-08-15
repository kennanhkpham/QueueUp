import streamlit as st
from queue_logic import (
    initialize_queue, 
    clear_queue, 
    update_courts_count, 
    finish_court_match, 
    assign_next_group_to_court
)

st.set_page_config(page_title="Pickleball Queue System", page_icon="🏓", layout="wide")

initialize_queue()

# --- Sidebar ---
with st.sidebar:
    st.header("Player Check-in")
    name = st.text_input("Player Name")
    skill = st.selectbox("Skill Level", ["Beginner", "Intermediate", "Advanced"])
    number_of_people = st.number_input("Enter number of players", min_value=1, max_value=4, value=1, step=1)

    if st.button("Join Queue"):
        if name:
            new_entry = {
                "name": name,
                "skill": skill,
                "count": number_of_people,
            }
            st.session_state.queue.append(new_entry)
            st.success(
                f"Added {name} ({'Solo' if number_of_people == 1 else f'Group of {number_of_people}'}) to queue!"
            )

# Retrieve current number of courts from session state (or default to 5)
if "num_courts" not in st.session_state:
    st.session_state.num_courts = 5

num_courts = st.session_state.num_courts

# --- Main Page Display ---
st.title("🏓 Pickleball Court Queue")

# Calculate total individual players waiting in the queue
total_waiting_players = sum(entry["count"] for entry in st.session_state.queue)
st.metric(label="Total Players Waiting in Queue", value=total_waiting_players)

st.markdown("---")

# --- Active Courts Section ---
st.header("🏟️ Active Courts")

court_cols = st.columns(3)

for court_num in range(1, num_courts + 1):
    col_idx = (court_num - 1) % 3
    with court_cols[col_idx]:
        st.subheader(f"Court {court_num}")
        court_groups = st.session_state.courts.get(court_num, [])
        
        if court_groups:
            st.caption(f"**Level:** {court_groups[0]['skill']}")
            for idx, group in enumerate(court_groups, start=1):
                label = "Solo" if group['count'] == 1 else f"Group of {group['count']}"
                st.write(f"• **{group['name']}** ({label})")
            
            if st.button(f"Finish Match (Court {court_num})", key=f"finish_{court_num}"):
                finish_court_match(court_num)
                st.rerun()
        else:
            st.caption("Court Empty")
            if st.session_state.queue:
                if st.button(f"Fill Court {court_num}", key=f"fill_{court_num}"):
                    assign_next_group_to_court(court_num)
                    st.rerun()

st.markdown("---")

# --- Categorized Waiting List Section ---
st.header("Full Waiting List by Category")
col_beg, col_int, col_adv = st.columns(3)

beginners = [p for p in st.session_state.queue if p["skill"] == "Beginner"]
intermediates = [p for p in st.session_state.queue if p["skill"] == "Intermediate"]
advanced = [p for p in st.session_state.queue if p["skill"] == "Advanced"]

with col_beg:
    st.subheader("🟢 Beginner")
    if beginners:
        for idx, player in enumerate(beginners, start=1):
            st.write(f"{idx}. **{player['name']}** ({player['count']} player{'s' if player['count'] > 1 else ''})")
    else:
        st.caption("No beginners waiting.")

with col_int:
    st.subheader("🔵 Intermediate")
    if intermediates:
        for idx, player in enumerate(intermediates, start=1):
            st.write(f"{idx}. **{player['name']}** ({player['count']} player{'s' if player['count'] > 1 else ''})")
    else:
        st.caption("No intermediates waiting.")

with col_adv:
    st.subheader("🔴 Advanced")
    if advanced:
        for idx, player in enumerate(advanced, start=1):
            st.write(f"{idx}. **{player['name']}** ({player['count']} player{'s' if player['count'] > 1 else ''})")
    else:
        st.caption("No advanced players waiting.")

st.markdown("---")

# --- Admin Controls ---
st.header("Admin Controls")

# Define confirmation dialog
@st.dialog("Confirm Queue Clear")
def confirm_clear_dialog():
    st.write("Are you sure you want to clear the entire waiting queue? This action cannot be undone.")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Yes, Clear Queue", type="primary"):
            clear_queue()
            st.rerun()
    with col2:
        if st.button("Cancel"):
            st.rerun()

# Trigger dialog on initial click
if st.button("Clear Entire Waiting Queue"):
    confirm_clear_dialog()

st.subheader("Court Settings")
new_num_courts = st.number_input(
    "Number of Active Courts", 
    min_value=1, 
    max_value=10, 
    value=num_courts, 
    step=1
)

if new_num_courts != num_courts:
    st.session_state.num_courts = new_num_courts
    update_courts_count(new_num_courts)
    st.rerun()