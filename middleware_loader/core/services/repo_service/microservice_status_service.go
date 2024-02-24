package services

import (
	"middleware_loader/infrastructure/repository"
)

type MicroserviceStatusService struct {
	Repository repository.MicroserviceStatusRepository
}

func NewMicroserviceStatusService(repo repository.MicroserviceStatusRepository) *MicroserviceStatusService {
	return &MicroserviceStatusService{repo}
}

func (s *MicroserviceStatusService) GetMicroserviceStatus() (string, error) {
	return "nil", nil
}