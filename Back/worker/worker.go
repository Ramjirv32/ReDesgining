package worker

import (
	"log"
	"sync"
)

type Task func()

var (
	taskQueue chan Task
	once      sync.Once
)

func Init(workerCount int, queueSize int) {
	once.Do(func() {
		taskQueue = make(chan Task, queueSize)
		for i := 0; i < workerCount; i++ {
			go worker(i)
		}
		log.Printf("Worker pool started with %d workers and queue size %d", workerCount, queueSize)
	})
}

func Submit(task Task) {
	if taskQueue == nil {
		log.Println("Worker pool not initialized, executing task synchronously")
		task()
		return
	}
	taskQueue <- task
}

func worker(id int) {
	for task := range taskQueue {
		executeTask(id, task)
	}
}

func executeTask(workerID int, task Task) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Worker %d: task panicked: %v", workerID, r)
		}
	}()
	task()
}
