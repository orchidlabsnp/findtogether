// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CaseRegistry is AccessControl, Pausable {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    Counters.Counter private _caseIdCounter;

    enum CaseStatus { Open, Investigating, Resolved }
    enum CaseType { ChildMissing, ChildLabour, ChildHarassment }

    struct Case {
        uint256 id;
        string childName;
        uint8 age;
        string dateOfBirth;
        string hair;
        string eyes;
        uint16 height;
        uint16 weight;
        string location;
        string description;
        string contactInfo;
        CaseType caseType;
        address reporter;
        CaseStatus status;
        string imageUrl;
        string aiCharacteristics;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    mapping(uint256 => Case) public cases;
    mapping(address => uint256[]) public userCases;

    event CaseSubmitted(
        uint256 indexed caseId,
        string childName,
        address indexed reporter,
        uint256 timestamp
    );

    event CaseStatusUpdated(
        uint256 indexed caseId,
        CaseStatus oldStatus,
        CaseStatus newStatus,
        uint256 timestamp
    );

    event CaseUpdated(
        uint256 indexed caseId,
        address indexed updatedBy,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    function submitCase(
        string memory childName,
        uint8 age,
        string memory dateOfBirth,
        string memory hair,
        string memory eyes,
        uint16 height,
        uint16 weight,
        string memory location,
        string memory description,
        string memory contactInfo,
        CaseType caseType,
        string memory imageUrl,
        string memory aiCharacteristics
    ) public whenNotPaused returns (uint256) {
        require(bytes(childName).length > 0, "Child name cannot be empty");
        require(age > 0 && age < 18, "Invalid age");
        require(bytes(location).length > 0, "Location cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(contactInfo).length > 0, "Contact info cannot be empty");

        _caseIdCounter.increment();
        uint256 newCaseId = _caseIdCounter.current();

        Case storage newCase = cases[newCaseId];
        newCase.id = newCaseId;
        newCase.childName = childName;
        newCase.age = age;
        newCase.dateOfBirth = dateOfBirth;
        newCase.hair = hair;
        newCase.eyes = eyes;
        newCase.height = height;
        newCase.weight = weight;
        newCase.location = location;
        newCase.description = description;
        newCase.contactInfo = contactInfo;
        newCase.caseType = caseType;
        newCase.reporter = msg.sender;
        newCase.status = CaseStatus.Open;
        newCase.imageUrl = imageUrl;
        newCase.aiCharacteristics = aiCharacteristics;
        newCase.createdAt = block.timestamp;
        newCase.updatedAt = block.timestamp;
        newCase.exists = true;

        userCases[msg.sender].push(newCaseId);

        emit CaseSubmitted(newCaseId, childName, msg.sender, block.timestamp);
        return newCaseId;
    }

    function updateCaseStatus(uint256 caseId, CaseStatus newStatus) 
        public
        onlyAdmin
        whenNotPaused
    {
        require(cases[caseId].exists, "Case does not exist");
        require(newStatus <= CaseStatus.Resolved, "Invalid status");

        CaseStatus oldStatus = cases[caseId].status;
        cases[caseId].status = newStatus;
        cases[caseId].updatedAt = block.timestamp;

        emit CaseStatusUpdated(caseId, oldStatus, newStatus, block.timestamp);
    }

    function getCaseById(uint256 caseId) 
        public 
        view 
        returns (Case memory) 
    {
        require(cases[caseId].exists, "Case does not exist");
        return cases[caseId];
    }

    function getCasesByUser(address user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return userCases[user];
    }

    function getCurrentCaseId() public view returns (uint256) {
        return _caseIdCounter.current();
    }

    function updateCaseDetails(
        uint256 caseId,
        string memory description,
        string memory location,
        string memory contactInfo
    ) public whenNotPaused {
        require(cases[caseId].exists, "Case does not exist");
        require(
            cases[caseId].reporter == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        Case storage caseToUpdate = cases[caseId];
        if (bytes(description).length > 0) {
            caseToUpdate.description = description;
        }
        if (bytes(location).length > 0) {
            caseToUpdate.location = location;
        }
        if (bytes(contactInfo).length > 0) {
            caseToUpdate.contactInfo = contactInfo;
        }
        caseToUpdate.updatedAt = block.timestamp;

        emit CaseUpdated(caseId, msg.sender, block.timestamp);
    }

    function pause() public onlyAdmin {
        _pause();
    }

    function unpause() public onlyAdmin {
        _unpause();
    }
}
