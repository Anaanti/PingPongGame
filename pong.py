
import pygame
import random

# Initialize pygame
pygame.init()

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)

# Window size
size = (800, 600)
screen = pygame.display.set_mode(size)
pygame.display.set_caption("Pong")

# Paddle and Ball initial positions
rect_x = 400
rect_y = 580
ball_x = 400
ball_y = 300

# Paddle speed
rect_change_x = 0
rect_change_y = 0

# Ball speed
ball_change_x = 5
ball_change_y = 5

# Score
score = 0
font = pygame.font.SysFont('Calibri', 30, True, False)
score_font = pygame.font.SysFont('Calibri', 50, True, False)

# Draw paddle
def drawrect(x, y):
    pygame.draw.rect(screen, RED, [x, y, 100, 20])

# Draw ball
def drawball(x, y):
    pygame.draw.ellipse(screen, WHITE, [x, y, 15, 15])

# Display score
def display_score():
    score_text = score_font.render("Score: " + str(score), True, WHITE)
    screen.blit(score_text, [320, 20])

# Display game over screen
def game_over():
    game_over_text = font.render("Game Over", True, YELLOW)
    restart_text = font.render("Press R to Restart", True, WHITE)
    screen.blit(game_over_text, [330, 200])
    screen.blit(restart_text, [280, 300])

# Reset the game state
def reset_game():
    global rect_x, rect_y, ball_x, ball_y, ball_change_x, ball_change_y, score
    rect_x = 400
    rect_y = 580
    ball_x = 400
    ball_y = 300
    ball_change_x = 5
    ball_change_y = 5
    score = 0

# Main game loop
def main_game():
    global rect_x, rect_y, ball_x, ball_y, ball_change_x, ball_change_y, score, rect_change_x
    game_running = True
    clock = pygame.time.Clock()

    # Reset game state initially
    reset_game()

    while game_running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                game_running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    rect_change_x = -6
                elif event.key == pygame.K_RIGHT:
                    rect_change_x = 6
            elif event.type == pygame.KEYUP:
                if event.key == pygame.K_LEFT or event.key == pygame.K_RIGHT:
                    rect_change_x = 0

        # Update game logic
        rect_x += rect_change_x
        ball_x += ball_change_x
        ball_y += ball_change_y

        # Ball collision logic
        if ball_x <= 0 or ball_x >= 785:
            ball_change_x *= -1
        if ball_y <= 0:
            ball_change_y *= -1
        if ball_y >= 600:
            # Ball falls below the screen (Game Over)
            score = 0
            ball_x = 400
            ball_y = 300
            ball_change_x = 5
            ball_change_y = 5
            game_over()

        # Ball-paddle collision
        if rect_x <= ball_x <= rect_x + 100 and ball_y >= 565:
            ball_change_y *= -1
            score += 1
            ball_change_x += random.choice([1, -1])  # Slight variation in ball movement
            ball_change_y += 0.2  # Increase ball speed slightly

        # Draw everything
        screen.fill(BLACK)
        drawrect(rect_x, rect_y)
        drawball(ball_x, ball_y)
        display_score()

        if ball_y >= 600:
            # If game over, display game over screen and listen for restart
            pygame.display.flip()
            game_over_wait = True
            while game_over_wait:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        game_running = False
                        game_over_wait = False
                    elif event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_r:
                            reset_game()  # Reset the game state
                            game_over_wait = False
                            main_game()  # Restart the game

        # Boundary restrictions for paddle
        if rect_x < 0:
            rect_x = 0
        elif rect_x > 700:
            rect_x = 700

        # Update the screen
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()

# Run the game
main_game()
