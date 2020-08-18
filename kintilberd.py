import pygame, sys, random
import os

def draw_floor():
    screen.blit(FLOOR,(floor_x , 600))
    screen.blit(FLOOR,(floor_x + 576, 600))
def draw_bg():
    screen.blit(BG,(int(BG_x) , 0))
    screen.blit(BG,(int(BG_x) - 576, 0))
def create_pipe():
    random_pipe_pos = random.choice(pipe_height)
    bottom_pipe = pipe_surface.get_rect(midtop = (600,random_pipe_pos))
    
    
    
    top_pipe = pipe_surface.get_rect(midbottom = (600,random_pipe_pos +200))
    return top_pipe, bottom_pipe



def move_pipe(pipes):
    for pipe in pipes:
        pipe.centerx -= 5
    return pipes

def draw_pipe(pipes):
    
    for pipe in pipes:
        if pipe.bottom >= 700:
            screen.blit(pipe_surface, pipe)
        else:
            flip_pipe = pygame.transform.flip(pipe_surface, False, True)
            screen.blit(flip_pipe, pipe)
         
def check_collision(pipes):
    for pipe in pipes:
        if bird_rect.colliderect(pipe):
            pass

    if bird_rect.top <= -50 or bird_rect.bottom >= 600:
        pass
def tester ():
    bx, by = bird_rect.left, bird_rect.top
    pipex = HW - pipe_rect.center[0]
    pipey = HH - pipe_rect.center[1]
    offset = (int(bx-pipex)),(int(by-pipey))
    result = pipe_mask.overlap(bird_mask, offset)
    if result:
        print ("clo")



    
pygame.init()
height = 576                                        
width = 700
HH, HW = height/2, width/2 
screen = pygame.display.set_mode((height,width))
clock = pygame.time.Clock()
game_active = True
# game variable

gravity = 0.4
bird_movement = 0
BG_x = 0
floor_x = 0
pipe_list = []



# game source
BG = pygame.image.load("assets/backround5.png").convert_alpha()
BG = pygame.transform.scale(BG,(height, width))
 
FLOOR = pygame.image.load("assets/floor.png").convert_alpha()
FLOOR = pygame.transform.scale(FLOOR,(height, 100))

bird_surface = pygame.image.load("bird3.png").convert_alpha()
bird_surface = pygame.transform.scale(bird_surface,(50, 70))
bird_mask = pygame.mask.from_surface(bird_surface)
bird_rect = bird_surface.get_rect(midbottom = (100,302))
bx, by = bird_rect.left, bird_rect.top

pipe_surface = pygame.image.load("assets/sword.png").convert_alpha()
pipe_surface = pygame.transform.scale(pipe_surface,(100, 700))
pipe_mask = pygame.mask.from_surface(pipe_surface)
pipe_rect = pipe_surface.get_rect()
pipex = HW - pipe_rect.center[0]
pipey = HH - pipe_rect.center[1]

SPAWN = pygame.USEREVENT
pygame.time.set_timer(SPAWN, 500)
pipe_height = [100, 300, 200]
offset = (int(bx-pipex)),(int(by-pipey))
result = pipe_mask.overlap(bird_mask, offset)
if result:
    print ("clo")
    

# MAin game ---------loop 



while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:                # exit loop
            pygame.quit()
            break
            sys.exit
            
        if event.type == pygame.KEYDOWN:             # player play
            if event.key == pygame.K_SPACE:
                bird_movement = 0
                bird_movement -=10
        if event.type == SPAWN:                      # pipe spawn
            pipe_list.extend(create_pipe())
            


    
    
    

    
    draw_bg()                   # background
    BG_x += 0.25
    if BG_x >= 576:
        BG_x = 0

    if game_active:
        
        pipe_list = move_pipe(pipe_list)  #pipa
        draw_pipe(pipe_list)
          
        bird_movement += gravity    # bird
        bird_rect.centery += int(bird_movement)
        screen.blit(bird_surface, bird_rect)
        #game_active = check_collision(pipe_list)


    
    draw_floor()              # lantai
    floor_x -= 1
    if floor_x <= - 576:
        floor_x = 0
    check_collision(pipe_list)
    tester()
    pygame.display.update()
    clock.tick(120)
 

    
