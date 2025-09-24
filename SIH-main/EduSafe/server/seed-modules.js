const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Module = require('./models/Module');
const User = require('./models/User');
const Quiz = require('./models/Quiz');

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb+srv://testuser:Test%401234@cluster0.ts66lut.mongodb.net/test";
    console.log("Connecting to MongoDB with URI:", mongoURI ? "Valid URI" : "Invalid URI");
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedModules = async () => {
  try {
    // First, find or create a test user to be the instructor
    let testUser = await User.findOne({ email: 'instructor@edusafe.com' });
    
    if (!testUser) {
      testUser = await User.create({
        username: 'instructor',
        email: 'instructor@edusafe.com',
        password: 'password123',
        role: 'teacher'
      });
      console.log('Created test instructor user');
    }

    // Remove existing modules and quizzes to update with new ones
    await Quiz.deleteMany({});
    await Module.deleteMany({});
    console.log('Existing modules removed. Adding new modules.');

    // Sample modules data
    const modulesData = [
      {
        title: 'Cyberbullying Awareness',
        description: 'Learn about cyberbullying, its impact, and how to prevent it. This module covers identifying cyberbullying, supporting victims, and creating a positive online environment.',
        difficulty: 'beginner',
        duration: '2-3 hours',
        estimatedHours: 2.5,
        category: 'Online Safety',
        tags: ['cyberbullying', 'online safety', 'digital citizenship'],
        instructor: testUser._id,
        isPublished: true,
        isActive: true,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        lessons: [
          {
            title: 'Understanding Cyberbullying',
            content: 'Cyberbullying is bullying that takes place over digital devices like cell phones, computers, and tablets. It can occur through SMS, Text, and apps, or online in social media, forums, or gaming where people can view, participate in, or share content.',
            type: 'text',
            order: 1,
            estimatedTime: 15
          },
          {
            title: 'Types of Cyberbullying',
            content: 'Learn about different forms of cyberbullying including harassment, flaming, exclusion, outing, and cyberstalking.',
            type: 'text',
            order: 2,
            estimatedTime: 20
          },
          {
            title: 'Impact of Cyberbullying',
            content: 'Explore the psychological, emotional, and academic effects of cyberbullying on victims.',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=6ctd75a7_Yw',
            order: 3,
            estimatedTime: 25
          },
          {
            title: 'Cyberbullying Quiz',
            content: 'Test your knowledge about cyberbullying awareness and prevention.',
            type: 'quiz',
            order: 4,
            estimatedTime: 15,
            quizQuestions: [
              {
                question: 'What is cyberbullying?',
                options: [
                  'Bullying that only happens in person',
                  'Bullying that takes place over digital devices like cell phones, computers, and tablets',
                  'A type of computer virus',
                  'A form of online gaming'
                ],
                correctAnswer: 1,
                explanation: 'Cyberbullying is bullying that takes place over digital devices like cell phones, computers, and tablets.'
              },
              {
                question: 'Which of the following is NOT a form of cyberbullying?',
                options: [
                  'Posting hurtful comments on social media',
                  'Sending threatening messages',
                  'Helping someone report online harassment',
                  'Spreading rumors through digital messages'
                ],
                correctAnswer: 2,
                explanation: 'Helping someone report online harassment is actually a positive action that helps combat cyberbullying.'
              },
              {
                question: 'What should you do if you witness cyberbullying?',
                options: [
                  'Ignore it completely',
                  'Join in to avoid becoming a target yourself',
                  'Take screenshots and report it to a trusted adult',
                  'Directly confront the bully online'
                ],
                correctAnswer: 2,
                explanation: 'Taking screenshots as evidence and reporting cyberbullying to a trusted adult is the recommended approach.'
              }
            ]
          }
        ]
      },
      {
        title: 'Flood Safety and Preparedness',
        description: 'Learn essential knowledge about flood safety, preparedness, and response. This module covers understanding flood risks, preparing for floods, and what to do during and after a flood event.',
        difficulty: 'intermediate',
        duration: '3-4 hours',
        estimatedHours: 3.5,
        category: 'Natural Disaster Safety',
        tags: ['flood', 'disaster preparedness', 'emergency response'],
        instructor: testUser._id,
        isPublished: true,
        isActive: true,
        thumbnail: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        lessons: [
          {
            title: 'Understanding Flood Risks',
            content: 'Learn about different types of floods, flood-prone areas, and how to assess your risk level. This lesson covers flash floods, river floods, coastal floods, and urban flooding.',
            type: 'text',
            order: 1,
            estimatedTime: 20
          },
          {
            title: 'Flood Preparedness',
            content: 'Discover how to prepare for potential floods, including creating emergency kits, developing evacuation plans, and flood-proofing your home or school.',
            type: 'text',
            order: 2,
            estimatedTime: 25
          },
          {
            title: 'During and After a Flood',
            content: 'Essential safety measures to take during a flood event and recovery steps after flooding has occurred.',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=43M5mZuzHF8',
            order: 3,
            estimatedTime: 30
          },
          {
            title: 'Flood Safety Quiz',
            content: 'Test your knowledge about flood safety and preparedness.',
            type: 'quiz',
            order: 4,
            estimatedTime: 15,
            quizQuestions: [
              {
                question: 'What should you do if you encounter flood waters while driving?',
                options: [
                  'Drive through slowly if the water is not moving',
                  'Turn around and find another route',
                  'Accelerate to get through the water quickly',
                  'Wait in your car until the water recedes'
                ],
                correctAnswer: 1,
                explanation: 'Never drive through flood waters. Turn around and find another route - just 6 inches of water can cause loss of control and stalling of a vehicle.'
              },
              {
                question: 'Which of the following is NOT recommended for your emergency flood kit?',
                options: [
                  'Bottled water and non-perishable food',
                  'First aid supplies',
                  'Large electrical appliances',
                  'Flashlights and batteries'
                ],
                correctAnswer: 2,
                explanation: 'Large electrical appliances are not appropriate for emergency kits. Focus on essential, portable items.'
              },
              {
                question: 'What is the first thing you should do when a flood warning is issued for your area?',
                options: [
                  'Go outside to check water levels',
                  'Stay tuned to local news for updates and follow evacuation orders',
                  'Call friends to see if they are also affected',
                  'Take photos of your belongings for insurance'
                ],
                correctAnswer: 1,
                explanation: 'When a flood warning is issued, stay tuned to local news for updates and follow evacuation orders immediately if given.'
              }
            ]
          }
        ]
      },
      {
        title: 'Earthquake Safety Essentials',
        description: 'Comprehensive guide to earthquake safety and preparedness. Learn how to protect yourself during an earthquake, prepare your environment, and respond appropriately after seismic events.',
        difficulty: 'intermediate',
        duration: '3-4 hours',
        estimatedHours: 3.5,
        category: 'Natural Disaster Safety',
        tags: ['earthquake', 'seismic safety', 'emergency response'],
        instructor: testUser._id,
        isPublished: true,
        isActive: true,
        thumbnail: 'https://images.unsplash.com/photo-1584738766473-61c083514bf4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        lessons: [
          {
            title: 'Earthquake Science Basics',
            content: 'Understanding earthquakes: what causes them, how they are measured, and which areas are most at risk. Learn about tectonic plates, fault lines, and seismic waves.',
            type: 'text',
            order: 1,
            estimatedTime: 20
          },
          {
            title: 'Preparing for Earthquakes',
            content: 'How to prepare your home, school, or workplace for potential earthquakes. This includes securing furniture, creating emergency plans, and assembling disaster kits.',
            type: 'text',
            order: 2,
            estimatedTime: 25
          },
          {
            title: 'During and After an Earthquake',
            content: 'Critical safety actions to take during an earthquake (Drop, Cover, Hold On) and important steps for the aftermath, including checking for injuries and damage.',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=BLEPakj1YTY',
            order: 3,
            estimatedTime: 30
          },
          {
            title: 'Earthquake Safety Quiz',
            content: 'Test your knowledge about earthquake safety and preparedness.',
            type: 'quiz',
            order: 4,
            estimatedTime: 15,
            quizQuestions: [
              {
                question: 'What is the recommended action during an earthquake?',
                options: [
                  'Run outside immediately',
                  'Stand in a doorway',
                  'Drop, Cover, and Hold On',
                  'Call emergency services'
                ],
                correctAnswer: 2,
                explanation: 'Drop to the ground, take Cover under a sturdy table or desk, and Hold On until the shaking stops.'
              },
              {
                question: 'Which of the following should NOT be done after an earthquake?',
                options: [
                  'Check for injuries and provide first aid',
                  'Immediately use elevators to evacuate tall buildings',
                  'Listen to local news for emergency information',
                  'Check for gas leaks and other hazards'
                ],
                correctAnswer: 1,
                explanation: 'Never use elevators after an earthquake as they may be damaged or lose power.'
              },
              {
                question: 'What should be included in an earthquake preparedness kit?',
                options: [
                  'Only water and food',
                  'Water, food, first aid supplies, flashlight, battery-powered radio, and medications',
                  'Only important documents',
                  'Only electronic devices'
                ],
                correctAnswer: 1,
                explanation: 'A complete earthquake preparedness kit should include water, food, first aid supplies, flashlight, battery-powered radio, medications, and other essential items.'
              }
            ]
          }
        ]
      },
      {
        title: 'Landslide Awareness and Safety',
        description: 'Essential information about landslide risks, warning signs, and safety measures. Learn to identify landslide-prone areas, recognize early warning signs, and take appropriate safety actions.',
        difficulty: 'intermediate',
        duration: '3-4 hours',
        estimatedHours: 3.0,
        category: 'Natural Disaster Safety',
        tags: ['landslide', 'mudslide', 'geological hazards'],
        instructor: testUser._id,
        isPublished: true,
        isActive: true,
        thumbnail: 'https://images.unsplash.com/photo-1621528833554-c7a0a5d9b841?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        lessons: [
          {
            title: 'Understanding Landslides',
            content: 'Learn about the causes of landslides, including heavy rainfall, earthquakes, volcanic activity, and human factors such as deforestation and construction on unstable slopes.',
            type: 'text',
            order: 1,
            estimatedTime: 20
          },
          {
            title: 'Recognizing Warning Signs',
            content: 'How to identify potential landslide warning signs, such as cracks in the ground, tilting trees, unusual sounds, and changes in water flow patterns.',
            type: 'text',
            order: 2,
            estimatedTime: 25
          },
          {
            title: 'Landslide Safety Measures',
            content: 'Essential safety procedures to follow before, during, and after a landslide event, including evacuation routes, emergency communication, and recovery steps.',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=ZVpYbGb1C-E',
            order: 3,
            estimatedTime: 25
          },
          {
            title: 'Landslide Awareness Quiz',
            content: 'Test your knowledge about landslide risks and safety measures.',
            type: 'quiz',
            order: 4,
            estimatedTime: 15,
            quizQuestions: [
              {
                question: 'Which of the following is a warning sign of a potential landslide?',
                options: [
                  'Clear skies and dry conditions',
                  'Doors and windows that suddenly stick',
                  'Increased wildlife activity',
                  'Lower water levels in streams'
                ],
                correctAnswer: 1,
                explanation: 'Doors and windows that suddenly stick can indicate ground movement and structural changes, which may be early warning signs of a landslide.'
              },
              {
                question: 'What should you do if you suspect an imminent landslide?',
                options: [
                  'Stay in place and wait for it to pass',
                  'Move uphill away from the path of the landslide',
                  'Move downhill to get away faster',
                  'Stand behind a tree for protection'
                ],
                correctAnswer: 1,
                explanation: 'If you suspect an imminent landslide, move quickly uphill and away from the potential path of the debris flow.'
              },
              {
                question: 'Which factor does NOT typically contribute to landslides?',
                options: [
                  'Heavy rainfall',
                  'Earthquakes',
                  'Calm weather conditions',
                  'Deforestation'
                ],
                correctAnswer: 2,
                explanation: 'Calm weather conditions do not typically contribute to landslides. Landslides are often triggered by heavy rainfall, earthquakes, volcanic activity, or human activities like deforestation.'
              }
            ]
          }
        ]
      },
      {
        title: 'School Safety Fundamentals',
        description: 'Essential knowledge about physical safety in school environments. Learn about emergency procedures, identifying potential hazards, and creating a safe learning environment.',
        difficulty: 'beginner',
        duration: '3-4 hours',
        estimatedHours: 3.5,
        category: 'Physical Safety',
        tags: ['school safety', 'emergency procedures', 'hazard prevention'],
        instructor: testUser._id,
        isPublished: true,
        isActive: true,
        thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80',
        lessons: [
          {
            title: 'School Safety Basics',
            content: 'An introduction to the fundamental concepts of school safety and why it matters for everyone.',
            type: 'text',
            order: 1,
            estimatedTime: 20
          },
          {
            title: 'Emergency Procedures',
            content: 'Learn about different emergency procedures including fire drills, lockdowns, and evacuation protocols.',
            type: 'text',
            order: 2,
            estimatedTime: 30
          },
          {
            title: 'Identifying Potential Hazards',
            content: 'How to identify and report potential safety hazards in school environments.',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=KUv1-HBIg3g',
            order: 3,
            estimatedTime: 25
          },
          {
            title: 'School Safety Quiz',
            content: 'Test your knowledge about school safety fundamentals.',
            type: 'quiz',
            order: 4,
            estimatedTime: 15,
            quizQuestions: [
              {
                question: 'What should you do if you discover a safety hazard at school?',
                options: [
                  'Ignore it if it seems minor',
                  'Try to fix it yourself',
                  'Report it immediately to a teacher or staff member',
                  'Post about it on social media'
                ],
                correctAnswer: 2,
                explanation: 'Always report safety hazards to a teacher or staff member immediately, regardless of how minor they may seem.'
              },
              {
                question: 'During a fire drill, what should students do?',
                options: [
                  'Gather personal belongings before leaving',
                  'Exit quickly and quietly following designated routes',
                  'Call parents to inform them',
                  'Wait for individual instructions'
                ],
                correctAnswer: 1,
                explanation: 'During a fire drill, students should exit quickly and quietly following designated evacuation routes without stopping to gather personal belongings.'
              },
              {
                question: 'Which of the following is NOT a good practice for school safety?',
                options: [
                  'Keeping emergency exits clear',
                  'Reporting suspicious activity',
                  'Propping open secured doors for convenience',
                  'Participating in safety drills'
                ],
                correctAnswer: 2,
                explanation: 'Propping open secured doors compromises school security and should never be done, even for convenience.'
              }
            ]
          }
        ]
      },
      {
        title: 'Mental Health Awareness',
        description: 'Understand the importance of mental health, recognize warning signs, and learn strategies for maintaining good mental health in school settings.',
        difficulty: 'intermediate',
        duration: '4-5 hours',
        estimatedHours: 4.5,
        category: 'Mental Health',
        tags: ['mental health', 'well-being', 'stress management'],
        instructor: testUser._id,
        isPublished: true,
        isActive: true,
        thumbnail: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        lessons: [
          {
            title: 'Understanding Mental Health',
            content: 'An introduction to mental health concepts and why mental well-being is important for students.',
            type: 'text',
            order: 1,
            estimatedTime: 25
          },
          {
            title: 'Recognizing Warning Signs',
            content: 'Learn to identify warning signs of mental health issues in yourself and peers.',
            type: 'text',
            order: 2,
            estimatedTime: 30
          },
          {
            title: 'Stress Management Techniques',
            content: 'Practical strategies for managing stress and maintaining good mental health.',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=hnpQrMqDoqE',
            order: 3,
            estimatedTime: 35
          }
        ]
      }
    ];

    // Insert modules
    const createdModules = await Module.insertMany(modulesData);
    console.log('Sample modules data has been added to the database');

    // Create a Quiz document for each module that has a quiz lesson
    const quizzesToCreate = [];
    for (const createdModule of createdModules) {
      // Find the original module data by title to read quizQuestions metadata
      const original = modulesData.find(m => m.title === createdModule.title);
      if (!original) continue;

      const quizLesson = (original.lessons || []).find(lesson => lesson.type === 'quiz');
      let questions = [];
      if (quizLesson && Array.isArray(quizLesson.quizQuestions) && quizLesson.quizQuestions.length > 0) {
        // Map provided quizQuestions from lesson
        questions = quizLesson.quizQuestions.map((q, idx) => {
          const options = (q.options || []).map((opt, optIdx) => ({
            text: opt,
            isCorrect: q.correctAnswer === optIdx
          }));
          return {
            questionText: q.question,
            options,
            explanation: q.explanation || '',
            points: 1,
            type: 'single-choice',
            order: idx + 1,
            timeLimit: 60,
            difficulty: 'medium'
          };
        });
      } else {
        // Create a default 3-question quiz for modules without a quiz lesson
        const moduleTopic = createdModule.category || 'Safety';
        const defaults = [
          {
            questionText: `Which statement best describes ${moduleTopic.toLowerCase()} basics?`,
            options: [
              { text: `Ignoring ${moduleTopic.toLowerCase()} guidance is acceptable if experienced`, isCorrect: false },
              { text: `${moduleTopic} practices help reduce risks and keep people safe`, isCorrect: true },
              { text: `${moduleTopic} only applies to professionals`, isCorrect: false },
              { text: `${moduleTopic} is optional in schools`, isCorrect: false }
            ],
            explanation: `${moduleTopic} awareness reduces risk and improves outcomes.`,
            points: 1,
            type: 'single-choice',
            order: 1,
            timeLimit: 60,
            difficulty: 'easy'
          },
          {
            questionText: `What should you do first when facing a potential ${moduleTopic.toLowerCase()} hazard?`,
            options: [
              { text: 'Panic and act quickly without a plan', isCorrect: false },
              { text: 'Assess the situation and follow the recommended plan', isCorrect: true },
              { text: 'Share it on social media for advice', isCorrect: false },
              { text: 'Ignore it and continue', isCorrect: false }
            ],
            explanation: 'Assess and follow established procedures to minimize risk.',
            points: 1,
            type: 'single-choice',
            order: 2,
            timeLimit: 60,
            difficulty: 'medium'
          },
          {
            questionText: `Which is a good habit for ${moduleTopic.toLowerCase()}?`,
            options: [
              { text: 'Skipping drills and training', isCorrect: false },
              { text: 'Regular practice and preparedness', isCorrect: true },
              { text: 'Relying only on others to respond', isCorrect: false },
              { text: 'Waiting until an emergency to learn', isCorrect: false }
            ],
            explanation: 'Preparedness and practice improve safety outcomes.',
            points: 1,
            type: 'single-choice',
            order: 3,
            timeLimit: 60,
            difficulty: 'easy'
          }
        ];
        questions = defaults;
      }

      // Append two additional generic questions to enrich each quiz
      const extraQuestions = [
        {
          questionText: `Why is regular practice important for ${createdModule.title}?`,
          options: [
            { text: 'It wastes time', isCorrect: false },
            { text: 'It builds confidence and reduces mistakes', isCorrect: true },
            { text: 'It replaces planning', isCorrect: false },
            { text: 'It is only for experts', isCorrect: false }
          ],
          explanation: 'Practice strengthens skills and improves response quality.',
          points: 1,
          type: 'single-choice',
          order: (questions.length || 0) + 1,
          timeLimit: 60,
          difficulty: 'medium'
        },
        {
          questionText: `Which action best supports safe ${createdModule.category?.toLowerCase() || 'practice'}?`,
          options: [
            { text: 'Ignoring official guidance', isCorrect: false },
            { text: 'Following verified procedures and reporting hazards', isCorrect: true },
            { text: 'Only reacting during emergencies', isCorrect: false },
            { text: 'Relying on others to act first', isCorrect: false }
          ],
          explanation: 'Following procedures and reporting issues promotes safety.',
          points: 1,
          type: 'single-choice',
          order: (questions.length || 0) + 2,
          timeLimit: 60,
          difficulty: 'easy'
        }
      ];
      questions = [...questions, ...extraQuestions];

      quizzesToCreate.push({
        title: (quizLesson && quizLesson.title) || `${createdModule.title} Quiz`,
        description: (quizLesson && quizLesson.content) || `Test your understanding of ${createdModule.title}.`,
        module: createdModule._id,
        questions,
        instructor: original.instructor,
        isPublished: true,
        isActive: true,
        timeLimit: 30,
        passingScore: 70,
        maxAttempts: 3,
        showCorrectAnswers: true,
        showExplanations: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        tags: original.tags || [],
        category: original.category || ''
      });
    }

    if (quizzesToCreate.length > 0) {
      await Quiz.insertMany(quizzesToCreate);
      console.log(`Created ${quizzesToCreate.length} quizzes linked to modules.`);
    } else {
      console.log('No quizzes to create from module lessons.');
    }

    // Enrich modules with extra lessons (if needed)
    for (const createdModule of createdModules) {
      // Build two extra lessons appended to the end
      const existingCount = createdModule.lessons?.length || 0;
      const extraLessons = [
        {
          title: `${createdModule.title}: Best Practices Recap`,
          content: `A concise summary of key takeaways from ${createdModule.title}, with actionable best practices and do's and don'ts.`,
          type: 'text',
          order: existingCount + 1,
          estimatedTime: 10
        },
        {
          title: `${createdModule.title}: Case Study`,
          content: `Walk through a short case study to apply concepts from ${createdModule.title} to a realistic scenario.`,
          type: 'text',
          order: existingCount + 2,
          estimatedTime: 12
        }
      ];

      await Module.updateOne({ _id: createdModule._id }, { $push: { lessons: { $each: extraLessons } } });
    }
    console.log('Appended extra lessons to each module.');

  } catch (error) {
    console.error('Error seeding modules:', error);
  }
};

const runSeed = async () => {
  const conn = await connectDB();
  await seedModules();
  console.log('Seed completed');
  process.exit(0);
};

runSeed();