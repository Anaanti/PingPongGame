from flask import Flask, render_template, jsonify, request
import random
import os

app = Flask(__name__)

# Game state (in a real app, you'd use sessions or a database)
game_state = {
    'paddle_x': 400,
    'ball_x': 400,
    'ball_y': 300,
    'ball_dx': 5,
    'ball_dy': 5,
    'score': 0,
    'game_over': False
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/reset', methods=['POST'])
def reset():
    game_state['paddle_x'] = 400
    game_state['ball_x'] = 400
    game_state['ball_y'] = 300
    game_state['ball_dx'] = 5
    game_state['ball_dy'] = 5
    game_state['score'] = 0
    game_state['game_over'] = False
    return jsonify(game_state)

@app.route('/update', methods=['POST'])
def update():
    data = request.get_json()
    
    # Update paddle position
    game_state['paddle_x'] = data['paddle_x']
    
    # Only update ball if game is not over
    if not game_state['game_over']:
        # Update ball position
        game_state['ball_x'] += game_state['ball_dx']
        game_state['ball_y'] += game_state['ball_dy']
        
        # Ball collision with walls
        if game_state['ball_x'] <= 0 or game_state['ball_x'] >= 785:
            game_state['ball_dx'] *= -1
        
        if game_state['ball_y'] <= 0:
            game_state['ball_dy'] *= -1
        
        # Ball collision with paddle
        if (game_state['paddle_x'] <= game_state['ball_x'] <= game_state['paddle_x'] + 100 
                and game_state['ball_y'] >= 565):
            game_state['ball_dy'] *= -1
            game_state['score'] += 1
            game_state['ball_dx'] += random.choice([1, -1])
            game_state['ball_dy'] += 0.2
        
        # Ball falls below screen
        if game_state['ball_y'] >= 600:
            game_state['game_over'] = True
    
    return jsonify(game_state)

# Create templates directory if it doesn't exist
if not os.path.exists('templates'):
    os.makedirs('templates')

# Create static directory if it doesn't exist
if not os.path.exists('static'):
    os.makedirs('static')

# Create static/css directory if it doesn't exist
if not os.path.exists('static/css'):
    os.makedirs('static/css')

# Create static/js directory if it doesn't exist
if not os.path.exists('static/js'):
    os.makedirs('static/js')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)