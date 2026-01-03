from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# Game categories with their events and severity levels
CATEGORIES = {
    "Defense": {
        "Sack": "High",
        "Interception": "Mid",
        "Fumble lost": "Mid"
    },
    "Referees": {
        "Penalty": "Low",
        "Offsetting penalties": "Medium"
    },
    "Scoring": {
        "Field goal": "Mid",
        "Long field goal": "High",
        "2 point conv.": "High",
        "Touchdown": "High",
        "Long TD": "Round of shots",
        "Trick play touchdown": "Round of shots",
        "Chip shot FG": "Low",
        "Pick Six": "High",
        "Fumble Six": "High",
        "Safety": "High"
    },
    "Game Outcome": {
        "Trick play that works": "Mid",
        "First Down": "Low",
        "XP Missed": "Round of shots",
        "FG Missed": "Low",
        "Turnover on Downs": "Low",
        "3 & Out": "Low",
        "Lead change": "Low",
        "Kneel to end half": "Low",
        "Home team won coin toss": "Medium",
        "Away team won coin toss": "Medium",
        "Game goes to OT": "High",
        "Goal line stand": "Medium",
        "Team of your choice loses": "Shot"
    }
}

# Outcomes mapped by severity level
OUTCOMES = {
    "Low": [
        "Sip of your drink",
        "Everyone except you drink",
        "You + Person of choice drinks"
    ],
    "Mid": [
        "10 second chug",
        "Finish your beer",
        "Drink as many sips/seconds as the people there",
        "Everyone drinks"
    ],
    "Medium": [
        "10 second chug",
        "Finish your beer",
        "Everyone drinks"
    ],
    "High": [
        "Take a shot",
        "Chug full beer",
        "Shotgun beer"
    ],
    "Round of shots": [
        "Round of shots"
    ],
    "Shot": [
        "Take a shot"
    ]
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/categories')
def get_categories():
    return jsonify(CATEGORIES)

@app.route('/api/random-event/<category>')
def get_random_event(category):
    if category in CATEGORIES:
        events = CATEGORIES[category]
        event_name = random.choice(list(events.keys()))
        severity = events[event_name]
        outcome = random.choice(OUTCOMES[severity])

        return jsonify({
            'event': event_name,
            'outcome': outcome
        })
    return jsonify({'error': 'Category not found'}), 404

@app.route('/api/outcome/<severity>')
def get_outcome(severity):
    if severity in OUTCOMES:
        outcome = random.choice(OUTCOMES[severity])
        return jsonify({'outcome': outcome})
    return jsonify({'error': 'Severity not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
