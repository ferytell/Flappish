import pygame, sys, random

# Constants
HEIGHT = 706
WIDTH = 1100
d = -10
GRAVITY = 0.4
PIPE_SPAWN_TIME = 600
PIPE_SPEED = 5 
PIPE_HEIGHTS = [400, 450, 500]
floor_x = 0
game_active = True
bird_movement = 0
score = 0

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
clock = pygame.time.Clock()
pygame.display.set_caption("Flappish")

# Load images
BG = pygame.image.load("assets/backround.png").convert_alpha()
BG = pygame.transform.scale(BG, (WIDTH, HEIGHT))
FLOOR = pygame.image.load("assets/floor.png").convert_alpha()
FLOOR = pygame.transform.scale(FLOOR, (WIDTH, 100))
bird_surface = pygame.image.load("assets/bird3.png").convert_alpha()
bird_surface = pygame.transform.scale(bird_surface, (50, 70))
pipe_surface = pygame.image.load("assets/pipes.png").convert_alpha()
pipe_surface = pygame.transform.scale(pipe_surface, (100, 700))

# Create masks
bird_mask = pygame.mask.from_surface(bird_surface)
pipe_mask = pygame.mask.from_surface(pipe_surface)

# Bird initial position
bird_rect = bird_surface.get_rect(midbottom=(100, HEIGHT // 2))

# User events
SPAWN_PIPE = pygame.USEREVENT
pygame.time.set_timer(SPAWN_PIPE, PIPE_SPAWN_TIME)

pipe_list = []

def start_screen():
    while True: 
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN or event.type == pygame.MOUSEBUTTONDOWN:
                return

        # Clear the screen
        screen.fill((0, 0, 0))
        
        # Display the welcome message
        font = pygame.font.Font(None, 36)
        welcome_text = font.render("Welcome! Let's Play!", True, (255, 255, 255))
        text_rect = welcome_text.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 50))
        screen.blit(welcome_text, text_rect)
        
        # Draw the start button
        button_rect = pygame.Rect(WIDTH // 2 - 50, HEIGHT // 2 + 50, 100, 50)
        pygame.draw.rect(screen, (50, 50, 50), button_rect)
        button_font = pygame.font.Font(None, 24)
        button_text = button_font.render("Start", True, (255, 255, 255))
        button_text_rect = button_text.get_rect(center=button_rect.center)
        screen.blit(button_text, button_text_rect)

        pygame.display.flip()
        clock.tick(30)

def draw_bg():
    screen.blit(BG, (0, 0))

def draw_floor():
    screen.blit(FLOOR, (floor_x, HEIGHT - FLOOR.get_height()))
    screen.blit(FLOOR, (floor_x + WIDTH, HEIGHT - FLOOR.get_height()))

def create_pipe():
    pipe_gap = 300  # Adjust this value to control the gap between pipes
    random_pipe_pos = random.choice(PIPE_HEIGHTS)
    bottom_pipe = pipe_surface.get_rect(midtop=(WIDTH, random_pipe_pos))
    top_pipe = pipe_surface.get_rect(midbottom=(WIDTH, random_pipe_pos - pipe_gap))
    return top_pipe, bottom_pipe



def move_pipes(pipes):
    for pipe in pipes:
        pipe.centerx -= PIPE_SPEED
    
    # Remove pipes that are off-screen
    pipes = [pipe for pipe in pipes if pipe.right > 0]
    
    return pipes

def draw_pipes(pipes):
    global score
    for pipe in pipes:
        if pipe.bottom >= HEIGHT:
            screen.blit(pipe_surface, pipe)
        else:
            flipped_pipe = pygame.transform.flip(pipe_surface, False, True)
            screen.blit(flipped_pipe, pipe)

        if  pipe.centerx < bird_rect.centerx:
            score += 1  # Increment the score when a pipe is passed
     

def check_collision(pipes):
    for pipe in pipes:
        if bird_rect.colliderect(pipe):
            game_over()
            #print("check2")
            return True
    
    return False



def game_over():
    global game_active
    game_active = False
    #print("check1")

def game_over_screen():
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                mouse_pos = pygame.mouse.get_pos()
                play_again_rect = pygame.Rect(WIDTH // 2 - 75, HEIGHT // 2, 150, 50)
                exit_rect = pygame.Rect(WIDTH // 2 - 75, HEIGHT // 2 + 60, 150, 50)
                if play_again_rect.collidepoint(mouse_pos):
                    return True  # Restart the game
                elif exit_rect.collidepoint(mouse_pos):
                    pygame.quit()
                    sys.exit()

        # Clear the screen
        screen.fill((0, 0, 0))
        
        # Display "Game Over" text
        font = pygame.font.Font(None, 48)
        game_over_text = font.render("Game Over", True, (255, 0, 0))
        text_rect = game_over_text.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 50))
        screen.blit(game_over_text, text_rect)
        
        # Draw "Play Again" button
        play_again_rect = pygame.Rect(WIDTH // 2 - 75, HEIGHT // 2, 150, 50)
        pygame.draw.rect(screen, (50, 50, 50), play_again_rect)
        play_again_font = pygame.font.Font(None, 24)
        play_again_text = play_again_font.render("Play Again", True, (255, 255, 255))
        play_again_text_rect = play_again_text.get_rect(center=play_again_rect.center)
        screen.blit(play_again_text, play_again_text_rect)

        # Draw "Exit" button
        exit_rect = pygame.Rect(WIDTH // 2 - 75, HEIGHT // 2 + 60, 150, 50)
        pygame.draw.rect(screen, (50, 50, 50), exit_rect)
        exit_text = play_again_font.render("Exit", True, (255, 255, 255))
        exit_text_rect = exit_text.get_rect(center=exit_rect.center)
        screen.blit(exit_text, exit_text_rect)

        pygame.display.flip()
        clock.tick(30)


# Start Screen
start_screen()
# Main game loop

while True:
    for event in pygame.event.get():

        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE and bird_rect.top > 0:
                bird_movement = d
        if event.type == SPAWN_PIPE:
            pipe_list.extend(create_pipe())

    draw_bg()
    draw_floor()

    if game_active:
        bird_movement += GRAVITY
        bird_rect.centery += int(bird_movement)

        pipe_list = move_pipes(pipe_list)
        draw_pipes(pipe_list)

        if not check_collision(pipe_list):
            if bird_rect.top <= 0:
                bird_rect.top = 0
            if bird_rect.bottom >= HEIGHT - FLOOR.get_height():
                bird_rect.bottom = HEIGHT - FLOOR.get_height()

            screen.blit(bird_surface, bird_rect)

    else:
        # Game over screen or message
        # Display your game over message and handle any restart logic here
        if game_over_screen():
            # Restart the game if the player chooses to play again
            game_active = True
            bird_rect.centery = HEIGHT // 2
            bird_movement = 0
            pipe_list = []

    floor_x -= 1
    if floor_x <= -WIDTH:
        floor_x = 0
    font = pygame.font.Font(None, 36)
    score_text = font.render(f"Score: {score}", True, (255, 255, 255))
    score_text_rect = score_text.get_rect(topleft=(10, 10))
    screen.blit(score_text, score_text_rect)


    pygame.display.update()
    clock.tick(120)